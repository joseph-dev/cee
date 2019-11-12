const libxmljs = require("libxmljs")
const rules = require("./rules")
const fs = require('fs')

module.exports = function (xmlDoc){

  let response = {
    isValid: false,
    errors: []
  }

  // validate general request structure
  let xsdDoc = libxmljs.parseXml(fs.readFileSync(__dirname + '/templates/request.xml', 'utf8'))
  if (! xmlDoc.validate(xsdDoc)) {
    response.errors.push(xmlDoc.validationErrors.toString())
    return response
  }

  // validate members(params) of a certain request
  let command = xmlDoc.get('/methodCall/methodName').text()
  let membersRules = rules[command]
  let members = xmlDoc.get('/methodCall/params/param/value/struct').childNodes()

  for (let [member, memberRules] of Object.entries(membersRules)) {
    // check if the parameter is passed
    let memberNode = getMemberValue(members, member)
    if (! memberNode) {
      response.errors.push(`Error: Required parameter '${member}' has not been passed.`)
      return response
    }

    let memberDoc = libxmljs.parseXml(memberNode.toString(), 'utf8')
    let memberXsdDoc = libxmljs.parseXml(fs.readFileSync(__dirname + '/templates/members/' + memberRules.template + '.xml', 'utf8'))

    // validate against the template
    if (! memberDoc.validate(memberXsdDoc)) {
      response.errors.push(`Error in parameter '${member}': ` + memberDoc.validationErrors.toString().substr(7))
      return response
    }
  }

  response.isValid = true
  return response
}

// Helper for getting value of params
function getMemberValue(members, memberName) {
  let returnValue

  for (let [memberIndex, member] of Object.entries(members)) {
    if (member.name() === 'member' && member.get('name').text() === memberName) {
      returnValue = member.get('value')
      break
    }
  }

  return returnValue
}