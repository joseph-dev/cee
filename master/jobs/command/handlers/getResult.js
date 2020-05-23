const redis = require('../../../redis')
const cleanUp = require('../../cleanUp')

module.exports = async (params) => {

  let result = {
    compilation: "",
    execution: "",
    executed: false,
    interactive: false
  }
  
  try {

    const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminticket)

    if (! requestId) {
      throw new Error("The adminticket is not valid.")
    }

    let executionParams = await redis.hGetAsync(redis.REQUEST_SET, requestId)
    if (executionParams) {
      executionParams = JSON.parse(executionParams)
      result.interactive = executionParams.interactive
    }

    let executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
    if (executionResult) {
      executionResult = JSON.parse(executionResult)
      cleanUp(requestId)
      result.execution = executionResult.output
      result.executed = true
    }

  } catch (e) {

    console.log(e)
    // @TODO add logging

  }

  return result

}