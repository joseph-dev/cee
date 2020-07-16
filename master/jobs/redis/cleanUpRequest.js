const redis = require('../../redis')
const logger = require('../../logger')
const getPod = require('../k8s/getPod')

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

      const podName = `pod-${requestId}`
      const pod = await getPod(podName)
      const executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
      if (pod || executionResult) {
        return
      }

      params = JSON.parse(params)
      if (params.interactive) {
        await redis.hDelAsync(redis.EXECUTION_TICKET_SET, params.tickets.executionTicketId)
        await redis.hDelAsync(redis.MONITOR_TICKET_SET, params.tickets.monitorTicketId)
      }

      await redis.hDelAsync(redis.ADMIN_TICKET_SET, params.tickets.adminTicketId)
      await redis.hDelAsync(redis.REQUEST_SET, requestId)

      const redisMonitor = redis.duplicate()
      redisMonitor.publish(podName, 'execution:did-not-start')
      redisMonitor.quit()

    } catch (e) {

      logger.error(e)

    }

  })
}