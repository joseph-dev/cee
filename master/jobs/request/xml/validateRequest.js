const libxmljs = require("libxmljs")
const fs = require('fs')

module.exports = function (xmlDoc){

  let response = {
    isValid: false,
    errors: []
  }

  let xsdDoc = libxmljs.parseXml(fs.readFileSync(__dirname + '/templates/request.xml', 'utf8'))
  if (! xmlDoc.validate(xsdDoc)) {
    response.errors = xmlDoc.validationErrors
    return response
  }

  response.isValid = true
  return response
}