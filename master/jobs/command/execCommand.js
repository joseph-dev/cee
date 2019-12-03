const handlers = {
  request: require('./handlers/request'),
  available: require('./handlers/available'),
}

module.exports = (request) => {

  let handler = handlers[request.command]

  if (! handler) {
    throw new Error(`The "${request.command}" command is not supported.`)
  }

  return handler(request.params)

}