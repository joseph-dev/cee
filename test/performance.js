require('dotenv').config()
const prepareExecutionRequestBody = require('./helpers/prepareExecutionRequestBody')
const libxml = require("libxmljs")
const WebSocket = require('ws')
const axios = require('axios').create({
  baseURL: process.env.APP_URL
})

const contentType = process.env.API_TYPE === 'xml' ? 'application/xml' : 'application/json'
const executionUrl = process.env.APP_TYPE === 'jail' ? '/' : `/${process.env.RUNNER_NAME}`

const executionRequestBody = prepareExecutionRequestBody(process.env.API_TYPE, process.env.RUNNER_NAME, process.env.PAYLOAD_SCRIPT)

const hrstart = process.hrtime()
let numberOfFinishedExecutions = 0

for (let i = 1; i <= process.env.NUMBER_OF_REQUESTS; i++) {

  axios.post(executionUrl, executionRequestBody, {headers: {'Content-Type': contentType}}).then(async (response) => {

    let executionTicket
    if (response.headers['content-type'].includes('text/xml')) {
      const xmlDoc = libxml.parseXmlString(response.data)
      executionTicket = xmlDoc.get(`//member[name='executionticket']/value/string`).text()
    } else {
      executionTicket = response.data.executionTicket
    }

    const ws = new WebSocket(`${process.env.APP_SOCKET_URL}/${executionTicket}/execute`, {
      perMessageDeflate: false
    })

    ws.on('message', (data) => {
      console.log(data)
    })

    ws.on('close', () => {

      numberOfFinishedExecutions++
      // const ihrend = process.hrtime(hrstart)
      // console.info(`${numberOfFinishedExecutions}) Execution time: ${ihrend[0]}s ${Math.floor(ihrend[1] / 1000000)}ms`, )

      if (numberOfFinishedExecutions === parseInt(process.env.NUMBER_OF_REQUESTS)) {
        const hrend = process.hrtime(hrstart)
        console.info(`Requests executed: ${numberOfFinishedExecutions}; Execution time: ${hrend[0]}s ${Math.floor(hrend[1] / 1000000)}ms;`)
      }

    })

  }).catch(e => {

    console.log(e)

  })

}
