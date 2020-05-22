const redis = require('../redis')
const xbytes = require('xbytes')
const createJob = require('../jobs/k8s/createJob')
const watchJob = require('../jobs/k8s/watchJob')
const getPodInfoByJobName = require('../jobs/k8s/getPodInfoByJobName')

module.exports = (requestId) => new Promise(async (resolve, reject) => {

  let responseToReturn = {
    success: false,
    output: `CEE: execution failed (unknown reason)`
  }

  try {

    const params = JSON.parse(await redis.hGetAsync(redis.REQUEST_SET, requestId))
    if (! params) {
      throw new Error(`No params found for the request with id "${requestId}"`)
    }

    // Create a job
    const jobName = `job-${requestId}`
    const createJobResponse = await createJob(jobName, params.runner, requestId, params)
    if (![200, 201, 202].includes(createJobResponse.status)) {
      throw new Error("Failed to create a job")
    }

    // Watch the created job
    const watchJobResponse = await watchJob(jobName)
    if (watchJobResponse.status !== 200) {
      throw new Error("Failed to watch the created job")
    }

    // Process stream to see the changes
    const stream = watchJobResponse.data
    stream.on('data', async (chunk) => {

      try {

        const message = (Buffer.from(chunk)).toString()
        const chunkData = JSON.parse(message)

        if (chunkData.object.status.succeeded || chunkData.object.status.failed) {

          const podInfo = await getPodInfoByJobName(jobName)
          let containerTerminationReason = null

          // if there is info about pod status
          if (podInfo && podInfo.status) {
            // if there is the reason of container termination
            if (podInfo.status.containerStatuses && podInfo.status.containerStatuses.length && podInfo.status.containerStatuses[0].state.terminated) {
              containerTerminationReason = podInfo.status.containerStatuses[0].state.terminated.reason
              // if there is the reason of pod failure
            } else if (podInfo.status.phase === 'Failed') {
              containerTerminationReason = podInfo.status.message
            }
          }
          const outOfTime = chunkData.object.status.conditions[0].reason === 'DeadlineExceeded'
          const result = (containerTerminationReason === "Completed" && ! outOfTime) ? JSON.parse(await redis.hGetAsync(redis.RESULT_SET, requestId)) : null

          if (result) {
            responseToReturn = result
          } else if (outOfTime) {
            responseToReturn.output = `CEE: out of time (${params.maxTime}s)`
          } else if (containerTerminationReason === "OOMKilled") {
            responseToReturn.output = `CEE: out of memory (${xbytes(params.maxMemory, {iec: true})})`
          } else if (containerTerminationReason.includes('ephemeral local storage usage exceeds')) {
            responseToReturn.output = `CEE: out of storage (${xbytes(params.maxFileSize, {iec: true})})`
          }

          redis.hsetnx(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
          resolve(responseToReturn)
        }

      } catch (e) {

        redis.hsetnx(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
        resolve(responseToReturn)
        console.log(e) // @TODO implement error logging

      }

    })

  } catch (e) {

    redis.hsetnx(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
    resolve(responseToReturn)
    console.log(e) // @TODO implement error logging

  }

})