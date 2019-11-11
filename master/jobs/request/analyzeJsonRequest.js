const validateRequest = require('./json/validateRequest')

module.exports = async function (data) {

  let response = {
    isValid: true,
    body: {},
    errors: []
  }

  let validationResult = await validateRequest(data)
  if (! validationResult.isValid) {
    response.isValid = false
    response.errors = validationResult.errors
    return response
  }

  response.body = validationResult.body

  return response
}