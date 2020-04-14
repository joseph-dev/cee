const config = require('../../../config')

module.exports = async () => {

  // @TODO add real values
  return {
    status: 'ready',
    load: 0,
    maxTime: config.executionParams.time.max,
    maxFileSize: 67108864,
    maxMemory: config.executionParams.memory.max,
    maxProcesses: 500,
    securePort: config.network.securePort,
  }

}