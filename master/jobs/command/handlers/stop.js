const redis = require('../../../redis')
const getPod = require('../../k8s/getPod')
const deletePod = require('../../k8s/deletePod')

module.exports = async (params) => {

  let result = {
    stop: false,
  }

  // Get Request ID for the Admin Ticket
  const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminTicket)
  if (! requestId) {
    throw new Error("The admin ticket is not valid.")
  }

  // Get pod and check its status
  const podName = `pod-${requestId}`
  const pod = await getPod(podName)
  if (pod && pod.status.phase === 'Running') {
    if (await deletePod(podName)) {
      result.stop = true
    }
  }

  return result

}