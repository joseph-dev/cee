const _ = require('lodash')

module.exports = function (xmlDoc){

  let methodName = xmlDoc.get('/methodCall/methodName').text()
  let response = {
    command: methodName,
    params: {}
  }
  let members = xmlDoc.get('/methodCall/params/param/value/struct').childNodes()

  if (methodName === 'available') {

    response.params = {
      maxMemory: getMemberValue(members, 'maxmemory', 'int')
    }

  } else if (methodName === 'request') {

    response.params = {
      maxTime: getMemberValue(members, 'maxtime', 'int'),
      maxFileSize: getMemberValue(members, 'maxfilesize', 'int'),
      maxMemory: getMemberValue(members, 'maxmemory', 'int'),
      maxProcesses: getMemberValue(members, 'maxprocesses', 'int'),
      userId: getMemberValue(members, 'userid'),
      activityId: getMemberValue(members, 'activityid'),
      execute: getMemberValue(members, 'execute'),
      interactive: getMemberValue(members, 'interactive', 'int'),
      lang: getMemberValue(members, 'lang'),
      files: extractFiles(getMemberValue(members, 'files', 'struct').childNodes())
    }

  } else if (methodName === 'getresult') {

    response.params = {
      adminticket: getMemberValue(members, 'adminticket', 'string')
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