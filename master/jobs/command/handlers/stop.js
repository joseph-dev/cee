const redis = require('../../../redis')
const getJob = require('../../k8s/getJob')
const deleteJob = require('../../k8s/deleteJob')

module.exports = async (params) => {

  let result = {
    stop: false,
  }

  // Get Request ID for the Admin Ticket
  const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminticket)
  if (! requestId) {
    throw new Error("The adminticket is not valid.")
  }

  // Get job and check its status
  const jobName = `job-${requestId}`
  const job = await getJob(jobName)
  if (job && (!! job.status.active)) {
    if (await deleteJob(jobName)) {
      result.stop = true
    }
  }

  return result

}