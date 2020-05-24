const libxmljs = require("libxmljs")

module.exports = (req, res, next) => {

  req.isXml = (req.headers['content-type'] || '').toLowerCase() === 'application/xml'

  if (req.isXml) {

    try {
      req.body = libxmljs.parseXml(req.body)
    } catch (e) {
      res.status(400)
      res.render(`html/badRequest`, {error: "The passed XML document is not valid."})
      return
    }

  }

  next()
}