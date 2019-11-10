const express = require('express')
const app = express()
const port = 3000

// Middleware import
const bodyParser = require('body-parser')

// Other imports
const analyzeXmlRequest = require('./jobs/request/analyzeXmlRequest')
const analyzeJsonRequest = require('./jobs/request/analyzeJsonRequest')

// Middleware declaration

// parse an XML body into a string
app.use(bodyParser.text({ type: 'application/xml' }))

// Basic route for checking if the service is up
app.get('/OK', (req, res) => res.send('OK!'))

// Main endpoint
app.post('/', (req, res) => {

  let requestData = {}
  let contentTypeIsXml = (req.headers['content-type'] || '').toLowerCase() === 'application/xml'

  if (contentTypeIsXml) {
    requestData = analyzeXmlRequest(req.body)
  } else {
    requestData = analyzeJsonRequest(req.body)
  }

  if (! requestData.isValid) {
    res.send(requestData.errors)
    return
  }

  res.send(requestData.body)

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))