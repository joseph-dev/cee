const config = require('../../../config')
const redis = require('../../../redis')
const executeCode = require('../../executeCode')
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

  await redis.hSetAsync(redis.REQUEST_SET, requestId, JSON.stringify(params))
  redis.hSetAsync(redis.MONITOR_TICKET_SET, monitorTicketId, requestId)
  redis.hSetAsync(redis.ADMIN_TICKET_SET, adminTicketId, requestId)

  if (params.interactive) {
    redis.hSetAsync(redis.EXECUTION_TICKET_SET, executionTicketId, requestId)
  } else {
    executeCode(requestId).then((executionResult) => { /* Ignore the result */ })
  }

  return {
    adminTicket: adminTicketId,
    monitorTicket: monitorTicketId,
    executionTicket: executionTicketId,
    port: config.network.port,
    securePort: config.network.securePort
  }

}