const redis = require('../../redis')
const logger = require('../../logger')
const xbytes = require('xbytes')
const createJob = require('./createJob')
const deleteJob = require('./deleteJob')
const watchJob = require('./watchJob')
const getPodForJob = require('./getPodForJob')

module.exports = (requestId, monitorWs) => new Promise(async (resolve, reject) => {

  const jobName = `job-${requestId}`
  let responseToReturn = {
    success: false,
    output: `CEE: execution failed (unknown reason)`
  }

  try {

    // Get execution params
    const params = JSON.parse(await redis.hGetAsync(redis.REQUEST_SET, requestId))
    if (! params) {
      throw new Error(`No params found for the request with id "${requestId}"`)
    }

    // Create a job
    await createJob(jobName, requestId, params)
    monitorMessage(monitorWs, "job:created")

    // Watch the created job
    const stream = await watchJob(jobName)
    monitorMessage(monitorWs, "job:watching")

    let previousChunk = '', chunkData
    // Process stream to see the changes
    stream.on('data', async (chunk) => {

      try {

        const messages = ( previousChunk + (Buffer.from(chunk)).toString() ).replace(/\r/g, "").split(/\n/)

        // Temporary fix for the issue of cut watch notification
        try {

          chunkData = JSON.parse(messages[0])
          if (messages[1]) {
            previousChunk = messages[1]
          } else {
            previousChunk = ''
          }

        } catch (e) {

          previousChunk = messages[0]
          return
        }

        // If the job was manually deleted ('stop' command)
        if (chunkData.type === 'DELETED') {

          responseToReturn.output = `CEE: execution was manually stopped`
          await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
          monitorMessage(monitorWs, "execution:stopped")
          resolve(responseToReturn)

        // If the execution started
        } else if (chunkData.object.status.active) {

          monitorMessage(monitorWs, "execution:started")

        // If the execution succeeded or failed
        } else if (chunkData.object.status.succeeded || chunkData.object.status.failed) {

          const pod = await getPodForJob(jobName)
          let containerTerminationReason = null

          // if there is info about pod status
          if (pod && pod.status) {
            // if there is the reason of container termination
            if (pod.status.containerStatuses && pod.status.containerStatuses.length && pod.status.containerStatuses[0].state.terminated) {
              containerTerminationReason = pod.status.containerStatuses[0].state.terminated.reason
              // if there is the reason of pod failure
            } else if (pod.status.phase === 'Failed') {
              containerTerminationReason = pod.status.message
            }
          }
          const outOfTime = chunkData.object.status.conditions[0].reason === 'DeadlineExceeded'
          const result = (containerTerminationReason === "Completed" && ! outOfTime) ? JSON.parse(await redis.hGetAsync(redis.RESULT_SET, requestId)) : null

          if (result) {
            responseToReturn = result
            monitorMessage(monitorWs, "execution:finished")
          } else if (outOfTime) {
            responseToReturn.output = `CEE: out of time (${params.maxTime}s)`
            monitorMessage(monitorWs, "execution:failed:out-of-time")
          } else if (containerTerminationReason === "OOMKilled") {
            responseToReturn.output = `CEE: out of memory (${xbytes(params.maxMemory, {iec: true})})`
            monitorMessage(monitorWs, "execution:failed:out-of-memory")
          } else if (containerTerminationReason && containerTerminationReason.includes('ephemeral local storage usage exceeds')) {
            responseToReturn.output = `CEE: out of storage (${xbytes(params.maxFileSize, {iec: true})})`
            monitorMessage(monitorWs, "execution:failed:out-of-storage")
          } else {
            monitorMessage(monitorWs, "execution:failed:unknown-reason")
          }

          await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
          resolve(responseToReturn)
          await deleteJob(jobName)
          if (responseToReturn.output === 'CEE: execution failed (unknown reason)') {
            console.log(responseToReturn.output)
          }
        }

      } catch (e) {

        await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
        monitorMessage(monitorWs, "server:internal-error")
        resolve(responseToReturn)
        await deleteJob(jobName)
        logger.error(e)
        console.log(e)
        console.log((Buffer.from(chunk)).toString())

      }

    })

  } catch (e) {

    await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(responseToReturn))
    monitorMessage("server:internal-error")
    resolve(responseToReturn)
    await deleteJob(jobName)
    logger.error(e)
    console.log(e)

  }

})

const monitorMessage = (ws, message) => {
  if (ws) {
    ws.send(message)
  }
}