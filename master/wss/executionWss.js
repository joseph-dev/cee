const WebSocket = require('ws')
const redis = require('../redis')
const createJob = require('../jobs/k8s/createJob')
const watchJob = require('../jobs/k8s/watchJob')

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


  let watchJobResponse;
  try {

    // Create a job
    const jobName = `job-${ws.payload.executionId}`
    const createJobResponse = await createJob(jobName, ws.payload.runner, ws.payload.executionId)
    if (![200, 201, 202].includes(createJobResponse.status)) {
      throw new Error("Failed to create a job")
    }

    // Watch the created job
    watchJobResponse = await watchJob(jobName)
    if (watchJobResponse.status !== 200) {
      throw new Error("Failed to watch the created job")
    }

  } catch (e) {

    ws.close()
    redis.hDelAsync('execRequests', ws.payload.executionId)
    redis.hDelAsync('execResults', ws.payload.executionId)
    console.log(error) // @TODO implement error logging

  }


  // Process stream to see the changes
  const stream = watchJobResponse.data
  stream.on('data', async (chunk) => {

    try {

      const message = (Buffer.from(chunk)).toString()
      let chunkData = JSON.parse(message)

      if (chunkData.object.status.succeeded) {

        let result = JSON.parse(await redis.hGetAsync('execResults', ws.payload.executionId))
        if (result) {

          ws.send(result.output)
          ws.close()
          redis.hDelAsync('execRequests', ws.payload.executionId)
          redis.hDelAsync('execResults', ws.payload.executionId)
        }

      } else if (chunkData.object.status.failed) {

        ws.close()
        redis.hDelAsync('execRequests', ws.payload.executionId)
        redis.hDelAsync('execResults', ws.payload.executionId)

      }

    } catch (e) {

      ws.close()
      redis.hDelAsync('execRequests', ws.payload.executionId)
      redis.hDelAsync('execResults', ws.payload.executionId)
      console.log(error) // @TODO implement error logging

    }

  })

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