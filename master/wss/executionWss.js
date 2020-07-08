const WebSocket = require('ws')
const config = require('./../config')
const redis = require('./../redis')
const logger = require("../logger")
const executeCode = require('../jobs/k8s/executeCode')
const cleanUpResult = require('../jobs/redis/cleanUpResult')
const getPod = require('../jobs/k8s/getPod')

// WebSocket for execution
const executionWss = new WebSocket.Server({noServer: true})
executionWss.on('connection', async (ws) => {

  // set 'isAlive' property and callback for handling 'pong' event
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  try {

    const requestId = await redis.hGetAsync(redis.EXECUTION_TICKET_SET, ws.executionId)
    if (! requestId) {
      throw(`The executionticket is not valid. (EXECUTION_TICKET: ${ws.executionId})`)
    }

    const pod = await getPod(`pod-${requestId}`)
    const executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
    if (pod || executionResult) {
      throw(`The execution is being processed or has been processed already. (REQUEST_ID: ${requestId})`)
    }

    executeCode(requestId, ws).then(() => {
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
    ws.ping(() => {})
  })
}, 30000)


module.exports = executionWss