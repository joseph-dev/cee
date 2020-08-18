const sh = require('shelljs')
const path = require('path')
const fs = require('fs').promises
const pty = require('node-pty')
const program = require('commander')
const redis = require('./redis')

const REDIS_REQUEST_SET = 'requests'
const EXECUTION_FILE = 'vpl_execution'

const IO_MESSAGE_TYPE_MESSAGE = 'message'
const IO_MESSAGE_TYPE_COMMAND = 'command'
const IO_COMMAND_FINISH = 'finish'

const execute = async (requestId) => {

  const executionEventsChannel = `pod-${requestId}-events`
  const inputChannel = `pod-${requestId}-input`
  const outputChannel = `pod-${requestId}-output`

  const redisPublisher = redis.duplicate()
  const redisSubscriber = redis.duplicate()

  try {

    redisPublisher.publish(executionEventsChannel, "execution:started")

    // get params from Redis
    const paramsJson = await redis.hGetAsync(REDIS_REQUEST_SET, requestId)
    redis.quit()
    if (! paramsJson) {
      throw new Error(`Invalid request`)
    }
    const params = JSON.parse(paramsJson)

    // write all of the files
    let folderPath = sh.tempdir()
    for (let file of params.files) {
      await fs.mkdir(path.dirname(`${folderPath}/${file.name}`), {recursive: true})
      await fs.writeFile(`${folderPath}/${file.name}`, file.content)
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
    redisPublisher.publish(executionEventsChannel, "terminal:launched")

    // Process execution process events
    executionProcess.on('data', (data) => {
      redisPublisher.publish(outputChannel, JSON.stringify({type: IO_MESSAGE_TYPE_MESSAGE, value: data}))
      redisPublisher.publish(executionEventsChannel, "output:sent")
    })

    executionProcess.on('error', (error) => {
      console.log(error)
    })

    executionProcess.on('exit', (exitCode) => {
      console.log(`Exit code: ${exitCode}`)
      redisPublisher.publish(outputChannel, JSON.stringify({type: IO_MESSAGE_TYPE_COMMAND, value: IO_COMMAND_FINISH}))
      redisPublisher.publish(executionEventsChannel, "terminal:exited")
      redisPublisher.quit()
      redisSubscriber.quit()
    })

    // Process input channel messages
    redisSubscriber.on('message', (channel, message) => {
      const decodedMessage = JSON.parse(message)
      if (decodedMessage.type === IO_MESSAGE_TYPE_COMMAND) {
        if (decodedMessage.value === IO_COMMAND_FINISH) {
          executionProcess.kill(9)
        }
      } else if (decodedMessage.type === IO_MESSAGE_TYPE_MESSAGE) {
        executionProcess.write(decodedMessage.value)
        redisPublisher.publish(executionEventsChannel, "input:received")
      }
    })
    redisSubscriber.subscribe(inputChannel)

  } catch (error) {

    redis.quit()
    redisPublisher.quit()
    redisSubscriber.quit()
    console.log(error)
    process.exit(1)

  }

}

// Declare and parse cli parameters
program.requiredOption("--request-id <id>", "Request ID", parseInt)
program.parse(process.argv)

if (isNaN(program.requestId)){
  throw new Error(`Invalid value for '--request-id'`)
}

execute(program.requestId)