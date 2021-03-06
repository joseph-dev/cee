const handlers = {
  request: require('./handlers/request'),
  available: require('./handlers/available'),
  getresult: require('./handlers/getResult'),
  running: require('./handlers/running'),
  stop: require('./handlers/stop'),
}

module.exports = async (request) => {

  let handler = handlers[request.command]

  if (! handler) {
    throw new Error(`The "${request.command}" command is not supported.`)
  }

  return await handler(request.params)

}