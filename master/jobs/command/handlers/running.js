const redis = require('../../../redis')
const getJob = require('../../k8s/getJob')

module.exports = async (params) => {

  let result = {
    running: false,
  }
  
  try {

    const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminticket)

    if (! requestId) {
      throw new Error("The adminticket is not valid.")
    }

    const jobName = `job-${requestId}`
    const getJobResponse = await getJob(jobName)

    if (getJobResponse.status === 200) {
      if (!! getJobResponse.data.status.active) {
        result.running = true
      }
    }

  } catch (e) {

    console.log(e)
    // @TODO add logging

  }

  return result

}