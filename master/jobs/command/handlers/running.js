const redis = require('../../../redis')
const getJob = require('../../k8s/getJob')

module.exports = async (params) => {

  let result = {
    running: false,
  }

  // Get Request ID for the Admin Ticket
  const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminTicket)
  if (! requestId) {
    throw new Error("The admin ticket is not valid.")
  }

  // Get job and check its status
  const job = await getJob(`job-${requestId}`)
  if (job && (!! job.status.active)) {
    result.running = true
  }

  return result

}