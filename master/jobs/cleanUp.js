const redis = require('../redis')

module.exports = (requestId) => {
  redis.hget(redis.REQUEST_SET, requestId, (error, params) => {

    if (error) {
      console.log(error)
      // @TODO write error log
      return
    }

    if (! params) {
      return
    }

    try {

      params = JSON.parse(params)
      if (params.interactive) {
        redis.hDelAsync(redis.EXECUTION_TICKET_SET, params.tickets.executionTicketId)
      }

      redis.hDelAsync(redis.ADMIN_TICKET_SET, params.tickets.adminTicketId)
      redis.hDelAsync(redis.MONITOR_TICKET_SET, params.tickets.monitorTicketId)
      redis.hDelAsync(redis.REQUEST_SET, requestId)
      redis.hDelAsync(redis.RESULT_SET, requestId)

    } catch (e) {

    }

  })
}