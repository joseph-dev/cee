require('dotenv').config()
const libxml = require("libxmljs")
const {transports, createLogger, format} = require('winston')
const WebSocket = require('ws')
const prepareExecutionRequestBody = require('./helpers/prepareExecutionRequestBody')

// init tools
const axios = require('axios').create({
  baseURL: process.env.APP_URL
})
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: `logs/performance-${Date.now()}.log` })
  ]
})

// prepare environment
const contentType = process.env.API_TYPE === 'xml' ? 'application/xml' : 'application/json'
const executionUrl = process.env.APP_TYPE === 'jail' ? '/' : `/${process.env.RUNNER_NAME}`

// prepare request body
const executionRequestBody = prepareExecutionRequestBody(process.env.API_TYPE, process.env.RUNNER_NAME, process.env.PAYLOAD_SCRIPT)

// get execution start time
const hrstart = process.hrtime()
let numberOfFinishedExecutions = 0

// start making requests
logger.info("Starting execution")
for (let i = 1; i <= process.env.NUMBER_OF_REQUESTS; i++) {

  axios.post(executionUrl, executionRequestBody, {headers: {'Content-Type': contentType}}).then(async (response) => {

    // get execution ticket
    let executionTicket
    if (response.headers['content-type'].includes('text/xml')) {
      const xmlDoc = libxml.parseXmlString(response.data)
      executionTicket = xmlDoc.get(`//member[name='executionticket']/value/string`).text()
    } else {
      executionTicket = response.data.executionTicket
    }

    // create a websocket connection to get result
    const ws = new WebSocket(`${process.env.APP_SOCKET_URL}/${executionTicket}/execute`, {
      perMessageDeflate: false
    })

    ws.on('message', (data) => {
      logger.info(data)
    })

    ws.on('close', () => {

      numberOfFinishedExecutions++

      // calculate total execution time
      if (numberOfFinishedExecutions === parseInt(process.env.NUMBER_OF_REQUESTS)) {
        const hrend = process.hrtime(hrstart)
        logger.info({
          executedRequest: numberOfFinishedExecutions,
          executionTime: `${hrend[0]}s ${Math.floor(hrend[1] / 1000000)}ms`
        })
      }

    })

  }).catch((e) => {

    logger.error(e)

  })

}
