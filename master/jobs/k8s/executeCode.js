const redis = require('../../redis')
const logger = require('../../logger')
const xbytes = require('xbytes')
const createPod = require('./createPod')
const deletePod = require('./deletePod')
const watchPod = require('./watchPod')

const IO_MESSAGE_TYPE_MESSAGE = 'message'
const IO_MESSAGE_TYPE_COMMAND = 'command'
const IO_COMMAND_FINISH = 'finish'

module.exports = (requestId, clientWs) => new Promise(async (resolve, reject) => {

  const podName = `pod-${requestId}`

  const executionEventsChannel = `${podName}-events`
  const inputChannel = `${podName}-input`
  const outputChannel = `${podName}-output`

  const redisMonitor = redis.duplicate()
  const podInputRedis = redis.duplicate()
  const podOutputRedis = redis.duplicate()

  let executionResult = {
    success: false,
    output: ''
  }

  try {

    // Setup processing of execution IO
    podOutputRedis.on('message', (channel, message) => {
      const decodedMessage = JSON.parse(message)
      if (decodedMessage.type === IO_MESSAGE_TYPE_COMMAND) {
        if (decodedMessage.value === IO_COMMAND_FINISH) {
          podInputRedis.quit()
          podOutputRedis.quit()
        }
      } else {
        if (clientWs) {
          clientWs.send(decodedMessage.value)
        }
        executionResult.output += decodedMessage.value
      }
    })
    podOutputRedis.subscribe(outputChannel)

    // Process the client websocket events
    if (clientWs) {

      clientWs.on('message', (message) => {
        podInputRedis.publish(inputChannel, JSON.stringify({type: IO_MESSAGE_TYPE_MESSAGE, value: message}))
      })
      clientWs.on('close', () => {
        if (podInputRedis.connected) {
          podInputRedis.publish(inputChannel, JSON.stringify({type: IO_MESSAGE_TYPE_MESSAGE, value: IO_COMMAND_FINISH}))
        }
      })
      clientWs.on('error', (error) => {
        if (podInputRedis.connected) {
          podInputRedis.publish(inputChannel, JSON.stringify({type: IO_MESSAGE_TYPE_MESSAGE, value: IO_COMMAND_FINISH}))
        }
        logger.error(error)
      })
    }


    // Get execution params
    const params = JSON.parse(await redis.hGetAsync(redis.REQUEST_SET, requestId))
    if (! params) {
      throw new Error(`No params found for the request with id "${requestId}"`)
    }

    // Create a pod
    await createPod(podName, requestId, params)
    redisMonitor.publish(executionEventsChannel, "pod:created")

    // Watch the created pod
    const stream = await watchPod(podName)
    redisMonitor.publish(executionEventsChannel, "pod:watching")


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
          redisMonitor.publish(executionEventsChannel, "execution:stopped")
          redisMonitor.quit()
          resolve()

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
          const outOfTime = pod.status.reason === 'DeadlineExceeded'
          const finishedSuccessfully = containerTerminationReason === "Completed" && ! outOfTime

          if (finishedSuccessfully) {
            executionResult.success = true
            redisMonitor.publish(executionEventsChannel, "execution:finished")

          } else if (outOfTime) {
            executionResult.output = `CEE: out of time (${params.maxTime}s)`
            redisMonitor.publish(executionEventsChannel, "execution:failed:out-of-time")

          } else if (containerTerminationReason === "OOMKilled") {
            executionResult.output = `CEE: out of memory (${xbytes(params.maxMemory, {iec: true})})`
            redisMonitor.publish(executionEventsChannel, "execution:failed:out-of-memory")

          } else if (containerTerminationReason && containerTerminationReason.includes('ephemeral local storage usage exceeds')) {
            executionResult.output = `CEE: out of storage (${xbytes(params.maxFileSize, {iec: true})})`
            redisMonitor.publish(executionEventsChannel, "execution:failed:out-of-storage")

          } else {
            executionResult.output = `CEE: execution failed (unknown reason)`
            redisMonitor.publish(executionEventsChannel, "execution:failed:unknown-reason")
          }

          if (clientWs && ! finishedSuccessfully) {
            clientWs.send(executionResult.output)
          }
          stream.destroy()
          await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
          resolve()
          await deletePod(podName)
          redisMonitor.quit()

        }

      } catch (e) {

        if (clientWs) {
          clientWs.send(executionResult.output)
        }
        stream.destroy()
        await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
        redisMonitor.publish(executionEventsChannel, "server:internal-error")
        resolve()
        await deletePod(podName)
        redisMonitor.quit()
        podInputRedis.quit()
        podOutputRedis.quit()
        logger.error(e)

      }

    })

  } catch (e) {

    if (clientWs) {
      clientWs.send(executionResult.output)
    }
    await redis.hSetNxAsync(redis.RESULT_SET, requestId, JSON.stringify(executionResult))
    redisMonitor.publish(executionEventsChannel, "server:internal-error")
    resolve()
    await deletePod(podName)
    redisMonitor.quit()
    podInputRedis.quit()
    podOutputRedis.quit()
    logger.error(e)

  }

})
