const url = require('url')
const UrlPattern = require('url-pattern')
const executionWss = require('./wss/executionWss')
const redis = require('./redis')
const runners = require('./runners')

module.exports = async (request, socket, head) => {

  const pathname = url.parse(request.url).pathname
  const pattern = new UrlPattern(/^\/([a-z0-9.]+)\/([0-9]+)\/execute$/, ['runner', 'executionId'])
  const params = pattern.match(pathname)

  if (request.headers.upgrade !== 'websocket') {
    return
  }

  // if the path or runner is incorrect
  if (! params || ! runners.includes(params.runner)) {
    socket.destroy()
    return
  }

  const executionIdIsValid = await redis.hExistsAsync('execRequests', params.executionId)
  // if the execution ID is wrong
  if (! executionIdIsValid) {
    socket.destroy()
    return
  }

  const executionParams = JSON.parse(await redis.hGetAsync('execRequests', params.executionId))
  // if the current runner doesn't match the runner from the previous request
  if (executionParams.runner !== params.runner) {
    socket.destroy()
    return
  }

  executionWss.handleUpgrade(request, socket, head, (ws) => {
    ws.payload = {
      executionId: params.executionId,
      runner: params.runner
    }
    executionWss.emit('connection', ws, request)
  })

}