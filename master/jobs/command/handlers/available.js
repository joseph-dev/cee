const config = require('../../../config')

module.exports = async () => {

  // @TODO add real values
  return {
    status: 'ready',
    load: 0,
    maxTime: 600,
    maxFileSize: 67108864,
    maxMemory: 2097152000,
    maxProcesses: 500,
    securePort: config.network.securePort,
  }

}