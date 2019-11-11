const isvalid = require('isvalid')
const rules = require('./rules')

module.exports = async function (data) {
  let response = {
    isValid: true,
    body: {},
    errors: []
  }

  try {

    let validatedData = await isvalid(data, {
      command: {type: String, required: true, enum: ['available','request']},
      params: {type: Object, unknownKeys: 'allow', required: true}
    })

    // Validate against the proper schema
    validatedData.params = await isvalid(validatedData.params, rules[validatedData.command])

    response.body = validatedData

  } catch (e) {
    response.isValid = false
    response.errors.push(e)
  }

  return response
}