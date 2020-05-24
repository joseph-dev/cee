const runners = require('../runners')

module.exports = (req, res, next) => {

  if (! runners.includes(req.params.runner)) {
    res.sendStatus(404)
    return
  }

  next()

}