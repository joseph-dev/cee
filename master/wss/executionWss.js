const WebSocket = require('ws')
const redis = require('../redis')
const createJob = require('../jobs/k8s/createJob')
const watchJob = require('../jobs/k8s/watchJob')
const getPodInfoByJobName = require('../jobs/k8s/getPodInfoByJobName')

// WebSocket for execution
const executionWss = new WebSocket.Server({noServer: true})
executionWss.on('connection', async (ws) => {

  // set 'isAlive' property and callback for handling 'pong' event
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  // ignore incoming messages
  ws.on('message', (message) => {
  })

  // handling an error
  ws.on('error', (error) => {
    console.log(error) // @TODO implement error logging
  })



  let responseToSend = `CEE: execution failed (unknown reason)`

  try {

    const params = JSON.parse(await redis.hGetAsync('execRequests', ws.payload.executionId))
    if (! params) {
      throw new Error(`No params found for the request with id "${ws.payload.executionId}"`)
    }

    // Create a job
    const jobName = `job-${ws.payload.executionId}`
    const createJobResponse = await createJob(jobName, ws.payload.runner, ws.payload.executionId, params)
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
          if (
            podInfo &&
            podInfo.status.containerStatuses.length &&
            podInfo.status.containerStatuses[0].state.terminated
          ) {
            containerTerminationReason = podInfo.status.containerStatuses[0].state.terminated.reason
          }
          const outOfTime = chunkData.object.status.conditions[0].reason === 'DeadlineExceeded'
          const result = (containerTerminationReason === "Completed" && ! outOfTime) ? JSON.parse(await redis.hGetAsync('execResults', ws.payload.executionId)) : null

          if (result) {
            responseToSend = result.output
          } else if (outOfTime) {
            responseToSend = `CEE: out of time (${params.maxTime}s)`
          } else if (containerTerminationReason === "OOMKilled") {
            responseToSend = `CEE: out of memory (${params.maxMemory}B)`
          }

          ws.send(responseToSend)
          ws.close()
          redis.hDelAsync('execRequests', ws.payload.executionId)
          redis.hDelAsync('execResults', ws.payload.executionId)
        }

      } catch (e) {

        ws.send(responseToSend)
        ws.close()
        redis.hDelAsync('execRequests', ws.payload.executionId)
        redis.hDelAsync('execResults', ws.payload.executionId)
        console.log(e) // @TODO implement error logging

      }

    })

  } catch (e) {

    ws.send(responseToSend)
    ws.close()
    redis.hDelAsync('execRequests', ws.payload.executionId)
    redis.hDelAsync('execResults', ws.payload.executionId)
    console.log(e) // @TODO implement error logging

  }

})


// Every 30 seconds check every WS connection
setInterval(() => {
  executionWss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate()
      return
    }

    ws.isAlive = false
    ws.ping(null, false, true)
  })
}, 30000)


module.exports = executionWss