module.exports = (commands) => {

  return (req, res, next) => {

    let command, error

    if (req.isXml) {
      command = req.body.get('/methodCall/methodName').text()
      if (! command) {
        error = `The '/methodCall/methodName' node is missing`
      }
    } else {
      command = req.body.command
      if (! command) {
        error = `The 'command' is missing`
      }
    }

    if (command && ! commands.includes(command)) {
      error = `The '${command}' command is not supported.`
    }

    if (error) {
      res.status(400)

      if (req.isXml) {
        res.render(`html/badRequest`, {error: error})
      } else {
        res.send([error])
      }

      return
    }

    next()

  }

}