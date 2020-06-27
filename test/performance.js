require('dotenv').config()
const libxml = require("libxmljs")
const {transports, createLogger, format} = require('winston')
const WebSocket = require('ws')
const prepareExecutionRequestBody = require('./helpers/prepareExecutionRequestBody')

// init tools
const axios = require('axios').create({
  baseURL: process.env.APP_URL
})

const replaceErrors = (key, value) => {
  if (value instanceof Buffer) {
    return value.toString()
  } else if (value instanceof Error) {
    let error = {}

    Object.getOwnPropertyNames(value).forEach(function (key) {
      error[key] = value[key]
    })

    return error
  }

  return value
}
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json({ replacer: replaceErrors })
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

  setTimeout(() => {

    const executionStart = process.hrtime()

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

        const executionEnd = process.hrtime(executionStart)

        logger.info({
          requestNumber: i,
          result: data,
          executionTime: executionEnd[0] + Math.floor(executionEnd[1] / 1000000) / 1000
        })
      })

      ws.on('error', (e) => {
        numberOfFinishedExecutions++
        logger.error(e)
      })

      ws.on('close', () => {

        numberOfFinishedExecutions++

        // calculate total execution time
        if (numberOfFinishedExecutions === parseInt(process.env.NUMBER_OF_REQUESTS)) {
          const hrend = process.hrtime(hrstart)
          logger.info({
            executedRequests: numberOfFinishedExecutions,
            executionTime: `${hrend[0]}s ${Math.floor(hrend[1] / 1000000)}ms`
          })
        }

      })

    }).catch((e) => {

      logger.error(e)

    })

  }, (i -1) * process.env.INTERVAL_BETWEEN_REQUESTS)

}
