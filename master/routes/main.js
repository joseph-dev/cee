const analyzeXmlRequest = require('./../jobs/request/analyzeXmlRequest')
const analyzeJsonRequest = require('./../jobs/request/analyzeJsonRequest')
const execCommand = require('./../jobs/command/execCommand')

module.exports = async (req, res) => {

  try {

    let requestData = {}

    // Analyze request according to its type
    if (req.isXml) {
      requestData = await analyzeXmlRequest(req.body)
    } else {
      requestData = await analyzeJsonRequest(req.body)
    }

    // If the request is not valid return the errors
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

  } catch (e) {
    console.log(e) // @TODO add logging
    res.sendStatus(500)
  }

}