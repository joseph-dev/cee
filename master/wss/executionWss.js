const WebSocket = require('ws')
const axios = require('axios')
const redis = require('../redis')

// WebSocket for execution
const executionWss = new WebSocket.Server({ noServer: true })
executionWss.on('connection', async (ws) => {

  // set 'isAlive' property and callback for handling 'pong' event
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  // ignore incoming messages
  ws.on('message', (message) => {})

  // handling an error @TODO implement error logging
  ws.on('error', (error) => {console.log(error)})

  // make a request to execute the code
  axios.post(`http://runner/execute/${ws.payload.executionId}`)
    .then((response) => {
      ws.send(response.data.output)
    })
    .catch((error) => {
      console.log(error) //@TODO implement error logging
    })
    .finally(() => {
      ws.close()
      redis.hDelAsync('execRequests', ws.payload.executionId)
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