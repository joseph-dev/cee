const config = require('../../../config')
const redis = require('../../../redis')
const moment = require('moment')
const executeCode = require('../../k8s/executeCode')
const cleanUpRequest = require('../../redis/cleanUpRequest')
const cleanUpResult = require('../../redis/cleanUpResult')
const randomNumber = require("random-number-csprng")

module.exports = async (params) => {

  const MIN_NUMBER = Math.pow(2,40)
  const MAX_NUMBER = Number.MAX_SAFE_INTEGER
  const requestId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  const adminTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  const monitorTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  const executionTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  params.tickets = {
    adminTicketId,
    monitorTicketId,
    executionTicketId
  }
  params.receivedAt = moment().format()

  await redis.hSetAsync(redis.REQUEST_SET, requestId, JSON.stringify(params))
  await redis.hSetAsync(redis.ADMIN_TICKET_SET, adminTicketId, requestId)
  await redis.hSetAsync(redis.MONITOR_TICKET_SET, monitorTicketId, requestId)

  if (params.interactive) {
    await redis.hSetAsync(redis.EXECUTION_TICKET_SET, executionTicketId, requestId)
    setTimeout(cleanUpRequest, config.cee.executionRequestTtl, requestId)
  } else {
    executeCode(requestId).then((executionResult) => {
      setTimeout(cleanUpResult, config.cee.executionResultTtl, requestId)
    })
  }

  return {
    adminTicket: adminTicketId,
    monitorTicket: monitorTicketId,
    executionTicket: executionTicketId,
    port: config.network.port,
    securePort: config.network.securePort
  }

}