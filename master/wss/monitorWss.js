const WebSocket = require('ws')
const redis = require('./../redis')
const logger = require("../logger")

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

  const redisMonitor = redis.duplicate()
  const executionEventsChannel = `pod-${requestId}-events`

  try {

    const requestId = await redis.hGetAsync(redis.MONITOR_TICKET_SET, ws.monitorId)
    if (! requestId) {
      throw new Error(`The monitorticket is not valid. (MONITOR_TICKET: ${ws.monitorId})`)
    }

    const executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
    if (executionResult) {
      ws.send("execution:already-finished")
      ws.close()
      redisMonitor.quit()
      return
    }

    redisMonitor.on('message', (channel, message) => {

      ws.send(message)

      if (message.match(/execution:(finished|stopped|failed|did-not-start).*/) || message === 'server:internal-error') {
        redisMonitor.quit()
        ws.close()
      }

    })
    redisMonitor.subscribe(executionEventsChannel)


  } catch (e) {

    ws.close()
    redisMonitor.quit()
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