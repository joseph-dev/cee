const config = require('../../../config')
const k8s = require('../../../k8s')
const xbytes = require('xbytes')

module.exports = async (params) => {

  // Get info about all the nodes and jobs
  const nodesResponse = await k8s.axios.get(`/api/v1/nodes`)
  const jobsResponse = await k8s.axios.get(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`)

  let status = {
    ready: false,
    allocatableMemory: 0,
    allocatableStorage: 0,
  }
  const jobsCount = jobsResponse.data.items.length

  for (const node of nodesResponse.data.items) {
    // Get node allocatable resources
    const allocatablePods = parseInt(node.status.allocatable['pods'])
    const allocatableMemory = xbytes.parseSize(node.status.allocatable['memory'] + 'B')
    const allocatableStorage = xbytes.parseSize(node.status.allocatable['ephemeral-storage'] + 'B')

    // Find what the max amount of available resources
    if (allocatablePods > 0 && allocatableMemory > status.allocatableMemory) {
      status.allocatableMemory = allocatableMemory
      status.allocatableStorage = allocatableStorage

      // check if the requested amount of memory can be allocated
      if (allocatableMemory > params.maxMemory && config.executionParams.memory.max >= params.maxMemory) {
        status.ready = true
      }
    }
  }

  return {
    status: status.ready ? 'ready' : 'busy',
    load: jobsCount,
    maxTime: config.executionParams.time.max,
    maxFileSize: Math.min(config.executionParams.storage.max, status.allocatableStorage),
    maxMemory: Math.min(config.executionParams.memory.max, status.allocatableMemory),
    maxProcesses: config.executionParams.processes.max,
    securePort: config.network.securePort,
  }

}