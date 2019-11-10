const libxmljs = require("libxmljs")
const validateRequest = require("./xml/validateRequest")
const parseRequest = require("./xml/parseRequest")

module.exports = function (data) {

  let xmlDoc
  let response = {
    isValid: true,
    body: {},
    errors: []
  }

  try {
    xmlDoc = libxmljs.parseXml(data)
  } catch (e) {
    response.isValid = false
    response.errors.push("The passed XML document is not valid.")
    return response
  }

  let validationResult = validateRequest(xmlDoc)
  if (! validationResult.isValid) {
    response.isValid = false
    response.errors = validationResult.errors
    return response
  }


  response.body = parseRequest(xmlDoc)

  return response
}