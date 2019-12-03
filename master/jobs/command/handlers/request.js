const redis = require('../../../redis')

module.exports = (data) => {

  const executionId = Date.now() // @TODO make execution if more unique(secure), check how it's done in VPL Jail server

  redis.hSetAsync('execRequests', executionId, JSON.stringify(data))

  return {executionId: executionId}

}