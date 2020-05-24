const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

// Other imports
const isRunnerSupported = require('./middlewares/isRunnerSupported')
const preprocessRequest = require('./middlewares/preprocessRequest')
const supportedCommands = require('./middlewares/supportedCommands')
const upgradeRequest = require('./upgradeRequest')
const routeHandlers = {
  status: require('./routes/status'),
  request: require('./routes/request'),
}

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

// Routes
app.get('/OK', routeHandlers.status)
app.post('/', [preprocessRequest, supportedCommands(['available', 'getresult'])], routeHandlers.request) // @TODO add 'running' and 'stop'
app.post('/:runner', [isRunnerSupported, preprocessRequest, supportedCommands(['request'])], routeHandlers.request)

// Process requests to wrong urls
app.use((req, res, next) => {
  res.sendStatus(404)
})


// Process http upgrade request
server.on('upgrade', upgradeRequest)

server.listen(port, () => console.log(`Example app listening on port ${port}!`))