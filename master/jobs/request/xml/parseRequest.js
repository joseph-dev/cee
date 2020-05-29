const _ = require('lodash')
const rules = require("./rules")

module.exports = function (xmlDoc){

  let methodName = xmlDoc.get('/methodCall/methodName').text()
  let response = {
    command: methodName,
    params: {}
  }
  let members = xmlDoc.get('/methodCall/params/param/value/struct').childNodes()

  const paramsRules = rules[methodName]
  for (let [param, paramRules] of Object.entries(paramsRules)) {

    let paramName = paramRules.as ? paramRules.as : param
    if (paramRules.template === 'files') {
      response.params[paramName] = extractFiles(getMemberValue(members, param, 'struct').childNodes())
    } else {
      response.params[paramName] = getMemberValue(members, param, paramRules.template)
    }

  }

  return response
}

// Helper for getting value of params
function getMemberValue(members, memberName, type = 'string') {
  let returnValue

  for (let [memberIndex, member] of Object.entries(members)) {
    if (member.name() === 'member' && member.get('name').text() === memberName) {
      returnValue = member.get('value/' + type)

      if (type !== 'struct') {
        returnValue = returnValue.text()
      }

      break
    }
  }

  if (type === 'int') {
    returnValue = parseInt(returnValue)
  }

  return returnValue
}

// Helper for extraction file names and their content from xml structure
function extractFiles (members) {
  members = _.filter(members, (member) => {
    return member.name() === 'member'
  })

  return _.map(members, (member) => {
    return {
      name: member.get('name').text(),
      content: member.get('value/string').text(),
    }
  })
}