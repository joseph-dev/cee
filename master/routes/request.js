const analyzeXmlRequest = require('./../jobs/request/analyzeXmlRequest')
const analyzeJsonRequest = require('./../jobs/request/analyzeJsonRequest')
const execCommand = require('./../jobs/command/execCommand')

module.exports = async (req, res) => {

  let requestData = {}

  // Check what kind of request is received and analyze it accordingly
  if (req.isXml) {
    requestData = analyzeXmlRequest(req.body)
  } else {
    requestData = await analyzeJsonRequest(req.body)
  }

  // Check if the request is valid. If it's not, return the found errors
  if (! requestData.isValid) {
    res.status(400)

    if (req.isXml) {
      res.render(`html/badRequest`, {error: requestData.errors[0]})
    } else {
      res.send(requestData.errors)
    }

    return
  }

  // Process the request
  requestData.body.params.runner = req.params.runner
  let commandResult = await execCommand(requestData.body)

  // send proper response
  if (req.isXml) {
    res.setHeader('content-type', 'text/xml');
    res.render(`xml/${requestData.body.command}`, commandResult)
  } else {
    res.send(commandResult)
  }

}