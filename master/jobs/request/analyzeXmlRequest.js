const validateRequest = require("./xml/validateRequest")
const parseRequest = require("./xml/parseRequest")

module.exports = async (data) => {

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


  response.body = parseRequest(data)

  return response
}