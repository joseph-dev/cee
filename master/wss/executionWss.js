const WebSocket = require('ws')
const redis = require('./../redis')
const executeCode = require('../jobs/executeCode')
const cleanUp = require('../jobs/cleanUp')

const INTERACTIVE_EXECUTION_TTL = 60000 // ttl (miliseconds) for the result ot be stored after interactive execution

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
    console.log(error) // @TODO implement error logging
  })


  const requestId = await redis.hGetAsync(redis.EXECUTION_TICKET_SET, ws.executionId)
  if (! requestId) {
    ws.close()
    return
  }

  executeCode(requestId).then((executionResult) => {
    ws.send(executionResult.output)
    ws.close()
    setTimeout(cleanUp, INTERACTIVE_EXECUTION_TTL, requestId)
  })

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