const redis = require('../../redis')
const logger = require('../../logger')

module.exports = (requestId) => {
  redis.hget(redis.REQUEST_SET, requestId, async (error, params) => {

    if (error) {
      logger.error(error)
      return
    }

    if (! params) {
      return
    }

    try {

      params = JSON.parse(params)
      if (params.interactive) {
        await redis.hDelAsync(redis.EXECUTION_TICKET_SET, params.tickets.executionTicketId)
        await redis.hDelAsync(redis.MONITOR_TICKET_SET, params.tickets.monitorTicketId)
      }

      await redis.hDelAsync(redis.ADMIN_TICKET_SET, params.tickets.adminTicketId)
      await redis.hDelAsync(redis.REQUEST_SET, requestId)
      await redis.hDelAsync(redis.RESULT_SET, requestId)

    } catch (e) {

      logger.error(e)

    }

  })
}