const redis = require('../../../redis')
const getPod = require('../../k8s/getPod')

module.exports = async (params) => {

  let result = {
    running: false,
  }

  // Get Request ID for the Admin Ticket
  const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminTicket)
  if (! requestId) {
    throw new Error("The admin ticket is not valid.")
  }

  // Get pod and check its status
  const pod = await getPod(`pod-${requestId}`)
  if (pod && (!! pod.status.phase === 'Running')) {
    result.running = true
  }

  return result

}