const sh = require('shelljs')
const fs = require('fs')
const pty = require('node-pty')
const WebSocket = require('ws')
const program = require('commander')
const redis = require('./redis')

const REDIS_REQUEST_SET = 'requests'
const EXECUTION_FILE = 'vpl_execution'

// Create websocket server
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 })

// Process ws connections
wss.on('connection', async (ws) => {

  try {

    // Declare and parse cli parameters
    program.requiredOption("--request-id <id>", "Request ID", parseInt)
    program.parse(process.argv)

    if (isNaN(program.requestId)){
      throw new Error(`Invalid value for '--request-id'`)
    }

    // get params from Redis
    const paramsJson = await redis.hGetAsync(REDIS_REQUEST_SET, program.requestId)
    if (! paramsJson) {
      throw new Error(`Invalid request`)
    }
    const params = JSON.parse(paramsJson)

    // write all of the files
    let folderPath = sh.tempdir()
    for (let file of params.files) {
      fs.writeFileSync(`${folderPath}/${file.name}`, file.content)
    }

    // change dir to where the files are and execute the needed files
    sh.cd(folderPath)

    // execute the entry point
    if (! sh.test('-e', params.execute)) {
      throw new Error(`File "${params.execute}" doesn't exist`)
    }
    sh.chmod('u+x', params.execute)
    sh.exec('./' + params.execute)

    // execute the final script
    if (! sh.test('-e', EXECUTION_FILE)) {
      throw new Error(`File "${EXECUTION_FILE}" doesn't exist`)
    }
    const executionProcess = pty.spawn(`${folderPath}/${EXECUTION_FILE}`, [], {})
    redis.publish(`pod-${program.requestId}`, "terminal:launched")

    // Process execution process events
    executionProcess.on('data', (data) => {
      ws.send(data)
      redis.publish(`pod-${program.requestId}`, "output:sent")
    })

    executionProcess.on('error', (error) => {
      console.log(error)
    })

    executionProcess.on('exit', (exitCode) => {
      console.log(`Exit code: ${exitCode}`)
      redis.publish(`pod-${program.requestId}`, "terminal:exited")
      redis.quit()
      ws.close()
      wss.close()
    })

    // Process websocket events
    ws.on('message', (message) => {
      executionProcess.write(message)
      redis.publish(`pod-${program.requestId}`, "input:received")
    })

    ws.on('close', () => {
      executionProcess.kill(9)
    })

    ws.on('error', () => {
      executionProcess.kill(9)
    })

  } catch (error) {

    ws.close()
    wss.close()
    console.log(error)

  }

})
