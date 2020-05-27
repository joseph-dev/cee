const WebSocket = require('ws')
const config = require('./../config')
const redis = require('./../redis')
const logger = require("../logger")
const executeCode = require('../jobs/k8s/executeCode')
const cleanUpResult = require('../jobs/redis/cleanUpResult')
const getJob = require('../jobs/k8s/getJob')

// WebSocket for execution
const executionWss = new WebSocket.Server({noServer: true})
executionWss.on('connection', async (ws) => {

  // set 'isAlive' property and callback for handling 'pong' event
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  // ignore incoming messages
  ws.on('message', (message) => {
  })

  // handling an error
  ws.on('error', (error) => {
    logger.error(error)
  })

  try {

    const requestId = await redis.hGetAsync(redis.EXECUTION_TICKET_SET, ws.executionId)
    if (! requestId) {
      throw(`The executionticket is not valid. (EXECUTION_TICKET: ${ws.executionId})`)
    }

    const job = await getJob(`job-${requestId}`)
    const executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
    if (job || executionResult) {
      throw(`The execution is being processed or has been processed already. (REQUEST_ID: ${requestId})`)
    }


    executeCode(requestId).then((executionResult) => {
      ws.send(executionResult.output)
      ws.close()
      setTimeout(cleanUpResult, config.cee.executionResultTtl, requestId)
    })

  } catch (e) {

    ws.close()
    logger.error(e)

  }

})


// Every 30 seconds check every WS connection
setInterval(() => {
  executionWss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate()
      return
    }

    ws.isAlive = false
    ws.ping(null, false, true)
  })
}, 30000)


module.exports = executionWss