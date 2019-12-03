const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

// Other imports
const analyzeXmlRequest = require('./jobs/request/analyzeXmlRequest')
const analyzeJsonRequest = require('./jobs/request/analyzeJsonRequest')
const execCommand = require('./jobs/command/execCommand')
const upgradeRequest = require('./upgradeRequest')

// Create the app
const app = express()
const server = http.createServer(app);
const port = 3000


// parse an XML body into a string
app.use(bodyParser.text({ type: 'application/xml' }))

// parse json
app.use(bodyParser.json({ type: 'application/json' }))

// set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/responses'));


// Basic route for checking if the service is up
app.get('/OK', (req, res) => res.send('OK!'))

// Main endpoint
app.post('/', async (req, res) => {

  let requestData = {}
  let contentTypeIsXml = (req.headers['content-type'] || '').toLowerCase() === 'application/xml'

  // Check what kind of request is received and analyze it accordingly
  if (contentTypeIsXml) {
    requestData = analyzeXmlRequest(req.body)
  } else {
    requestData = await analyzeJsonRequest(req.body)
  }

  // Check if the request is valid, if it's not return the found errors
  if (! requestData.isValid) {
    res.status(400)
    res.send(requestData.errors)
    return
  }

  // Process the request
  let commandResult = execCommand(requestData.body)

  // send proper response
  if (contentTypeIsXml) {
    res.setHeader('content-type', 'text/xml');
    res.render(`xml/${requestData.body.command}`, commandResult)
  } else {
    res.send(commandResult)
  }

})


// Process http upgrade request
server.on('upgrade', upgradeRequest)

server.listen(port, () => console.log(`Example app listening on port ${port}!`))