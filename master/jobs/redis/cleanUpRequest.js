const redis = require('../../redis')
const logger = require('../../logger')
const getJob = require('../k8s/getJob')

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

      const job = await getJob(`job-${requestId}`)
      const executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
      if (job || executionResult) {
        return
      }

      params = JSON.parse(params)
      if (params.interactive) {
        await redis.hDelAsync(redis.EXECUTION_TICKET_SET, params.tickets.executionTicketId)
        await redis.hDelAsync(redis.MONITOR_TICKET_SET, params.tickets.monitorTicketId)
      }

      await redis.hDelAsync(redis.ADMIN_TICKET_SET, params.tickets.adminTicketId)
      await redis.hDelAsync(redis.REQUEST_SET, requestId)

    } catch (e) {

      logger.error(e)

    }

  })
}