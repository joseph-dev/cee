const url = require('url')
const UrlPattern = require('url-pattern')
const executionWss = require('./wss/executionWss')
const redis = require('./redis')

module.exports = async (request, socket, head) => {

  const pathname = url.parse(request.url).pathname;
  const pattern = new UrlPattern('/:executionId/execute')
  const params = pattern.match(pathname)

  if (request.headers.upgrade !== 'websocket') {
    return;
  }

  const executionIdIsValid = await redis.hExistsAsync('execRequests', params.executionId)

  if (params && executionIdIsValid) {

    executionWss.handleUpgrade(request, socket, head, function done(ws) {
      ws.payload = {
        executionId: params.executionId
      }
      executionWss.emit('connection', ws, request)
    })

  } else {

    socket.destroy()

  }

}