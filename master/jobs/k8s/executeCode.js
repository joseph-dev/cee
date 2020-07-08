const redis = require('../../redis')
const logger = require('../../logger')
const xbytes = require('xbytes')
const WebSocket = require('../../ws')
const createPod = require('./createPod')
const deletePod = require('./deletePod')
const watchPod = require('./watchPod')

module.exports = (requestId, clientWs) => new Promise(async (resolve, reject) => {

  const podName = `pod-${requestId}`
  let executionResult = {
    success: false,
    output: `CEE: execution failed (unknown reason)`
  }

  try {

    // Get execution params
    const params = JSON.parse(await redis.hGetAsync(redis.REQUEST_SET, requestId))
    if (! params) {
      throw new Error(`No params found for the request with id "${requestId}"`)
    }

    // Create a pod
    await createPod(podName, requestId, params)
    monitorMessage("pod:created")

    // Watch the created pod
    const stream = await watchPod(podName)
    monitorMessage("pod:watching")

    let previousChunk = '', chunkData
    // Process stream to see the changes
    stream.on('data', async (chunk) => {

      try {

        // Temporary fix for the issue of cut watch notification
        const messages = ( previousChunk + (Buffer.from(chunk)).toString() ).replace(/\r/g, "").split(/\n/)
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
        const pod = chunkData.object

        // If the pod was manually deleted ('stop' command)
        if (chunkData.type === 'DELETED') {

          executionResult.output = `CEE: execution was manually stopped`
          if (clientWs) {
            clientWs.send(executionResult.output)
          }
          await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
          monitorMessage("execution:stopped")
          resolve()

          // If the execution started
        } else if (pod.status.phase === 'Running') {

          // Connect to the pod websocket to start execution
          let podWs = new WebSocket(`ws://${pod.status.podIP}:3000`, { // @TODO move port number to env var
            perMessageDeflate: false,
            retryCount: 5,
            reconnectInterval: 100
          })
          podWs.start()

          // Process the pod websocket events
          podWs.on('connect', () => {
            executionResult.output = ''
            monitorMessage("execution:started")
          })
          podWs.on('message', (msg) => {
            if (clientWs) {
              clientWs.send(msg.toString())
            }
            executionResult.output += msg.toString()
          })
          podWs.on('destroy', async () => {
            // don't close client socket now, it will be closed after the pod is terminated
          })
          podWs.on('error', (error) => {
            logger.error(error)
          })

          // Process the client websocket events
          if (clientWs) {

            clientWs.on('message', (msg) => {
              executionResult.output += msg
              podWs.send(msg)
            })
            clientWs.on('close', () => {
              podWs.destroy()
            })
            clientWs.on('error', (error) => {
              podWs.destroy()
              logger.error(error)
              resolve()
            })
          }

          // If the execution succeeded or failed
        } else if (['Succeeded', 'Failed'].includes(pod.status.phase)) {

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
          const outOfTime = pod.status.conditions && pod.status.conditions[0].reason === 'DeadlineExceeded'
          const finishedSuccessfully = containerTerminationReason === "Completed" && ! outOfTime

          if (finishedSuccessfully) {
            executionResult.success = true
            monitorMessage("execution:finished")

          } else if (outOfTime) {
            executionResult.output = `CEE: out of time (${params.maxTime}s)`
            monitorMessage("execution:failed:out-of-time")

          } else if (containerTerminationReason === "OOMKilled") {
            executionResult.output = `CEE: out of memory (${xbytes(params.maxMemory, {iec: true})})`
            monitorMessage("execution:failed:out-of-memory")

          } else if (containerTerminationReason && containerTerminationReason.includes('ephemeral local storage usage exceeds')) {
            executionResult.output = `CEE: out of storage (${xbytes(params.maxFileSize, {iec: true})})`
            monitorMessage("execution:failed:out-of-storage")

          } else {
            monitorMessage("execution:failed:unknown-reason")
          }

          if (clientWs && ! finishedSuccessfully) {
            clientWs.send(executionResult.output)
          }
          await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
          resolve()
          stream.destroy()
          await deletePod(podName)

        }

      } catch (e) {

        if (clientWs) {
          clientWs.send(executionResult.output)
        }
        await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
        monitorMessage("server:internal-error")
        resolve()
        stream.destroy()
        await deletePod(podName)
        logger.error(e)

      }

    })

  } catch (e) {

    if (clientWs) {
      clientWs.send(executionResult.output)
    }
    await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
    monitorMessage("server:internal-error")
    resolve()
    await deletePod(podName)
    logger.error(e)

  }

})

const monitorMessage = (message) => {
  // @TODO implement proper monitoring
}
