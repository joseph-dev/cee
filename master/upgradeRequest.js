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

  const requestId = parseInt(await redis.hGetAsync(redis.EXECUTION_TICKET_SET, params.executionId))
  // if the execution ID corresponds to a request ID
  if (! requestId) {
    socket.destroy()
    return
  }

  const requestParams = JSON.parse(await redis.hGetAsync(redis.REQUEST_SET, requestId))
  // if the current runner doesn't match the runner from the previous request
  if (requestParams.runner !== params.runner) {
    socket.destroy()
    return
  }

  executionWss.handleUpgrade(request, socket, head, (ws) => {
    ws.requestId = requestId
    executionWss.emit('connection', ws, request)
  })

}