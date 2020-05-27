const redis = require('../../../redis')
const cleanUp = require('../../redis/cleanUp')

module.exports = async (params) => {

  let result = {
    compilation: "",
    execution: "",
    executed: false,
    interactive: false
  }

  // Get Request ID for the Admin Ticket
  const requestId = await redis.hGetAsync(redis.ADMIN_TICKET_SET, params.adminticket)
  if (! requestId) {
    throw new Error("The adminticket is not valid.")
  }

  // Get execution params
  let executionParams = await redis.hGetAsync(redis.REQUEST_SET, requestId)
  if (! executionParams) {
    throw new Error("The adminticket is not valid.")
  }
  executionParams = JSON.parse(executionParams)
  result.interactive = executionParams.interactive

  // Get execution result
  let executionResult = await redis.hGetAsync(redis.RESULT_SET, requestId)
  if (executionResult) {
    executionResult = JSON.parse(executionResult)
    cleanUp(requestId)
    result.execution = executionResult.output
    result.executed = true
  }

  return result

}