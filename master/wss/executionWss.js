const WebSocket = require('ws')
const axios = require('axios')
const redis = require('../redis')

// WebSocket for execution
const executionWss = new WebSocket.Server({ noServer: true });
executionWss.on('connection', async (ws) => {

  // ignore incoming messages
  ws.on('message', (message) => {})

  // handling an error @TODO implement error logging
  ws.on('error', (error) => {console.log(error)})

  // make a request to execute the code
  axios.post(`http://runner/execute/${ws.payload.executionId}`)
    .then(function (response) {
      ws.send(response.data.output)
      ws.close()
      redis.hDelAsync('execRequests', ws.payload.executionId)
    })
    .catch(function (error) {
      console.log(error) //@TODO implement error logging
    })

});

module.exports = executionWss;