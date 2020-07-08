const config = require('../../../config')
const runners = require('../../../runners')
const getNodes = require('../../k8s/getNodes')
const getPods = require('../../k8s/getPods')
const xbytes = require('xbytes')

module.exports = async (params) => {

  // Get info about all the nodes and pods
  const nodes = await getNodes()
  const pods = await getPods()

  let status = {
    ready: false,
    allocatableMemory: 0,
    allocatableStorage: 0,
  }
  const podsCount = pods.length

  for (const node of nodes) {
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
    load: podsCount,
    maxTime: config.executionParams.time.max,
    maxFileSize: Math.min(config.executionParams.storage.max, status.allocatableStorage),
    maxMemory: Math.min(config.executionParams.memory.max, status.allocatableMemory),
    maxProcesses: config.executionParams.processes.max,
    securePort: config.network.securePort,
    runners: runners
  }

}