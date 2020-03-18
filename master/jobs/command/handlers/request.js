const redis = require('../../../redis')
const randomNumber = require("random-number-csprng")

module.exports = async (data) => {

  const MIN_NUMBER = Math.pow(2,40)
  const MAX_NUMBER = Number.MAX_SAFE_INTEGER
  const adminTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  const monitorTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)
  const executionTicketId = await randomNumber(MIN_NUMBER, MAX_NUMBER)

  redis.hSetAsync('execRequests', executionTicketId, JSON.stringify(data))

  // @TODO add real values
  return {
    adminTicket: adminTicketId,
    monitorTicket: monitorTicketId,
    executionTicket: executionTicketId,
    port: 80,
    securePort: 443,
  }

}