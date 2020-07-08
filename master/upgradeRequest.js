const url = require('url')
const UrlPattern = require('url-pattern')
const executionWss = require('./wss/executionWss')
const monitorWss = require('./wss/monitorWss')
const redis = require('./redis')
const logger = require('./logger')

module.exports = async (request, socket, head) => {

  if (request.headers.upgrade !== 'websocket') {
    return
  }

  try {

    const pathname = url.parse(request.url).pathname
    const pattern = new UrlPattern(/^\/([0-9]+)\/(execute)$/, ['ticketId', 'command'])
    const params = pattern.match(pathname)

    // proceed if the url is correct
    if (params) {

      // if it's an "execute" request and the ticket is valid
      if (params.command === 'execute' && await redis.hExistsAsync(redis.EXECUTION_TICKET_SET, params.ticketId)) {
        executionWss.handleUpgrade(request, socket, head, (ws) => {
          ws.executionId = params.ticketId
          executionWss.emit('connection', ws, request)
        })
        return
      }

      // if it's a "monitor" request and the ticket is valid
      // if (params.command === 'monitor' && await redis.hExistsAsync(redis.MONITOR_TICKET_SET, params.ticketId)) {
      //   monitorWss.handleUpgrade(request, socket, head, (ws) => {
      //     ws.monitorId = params.ticketId
      //     monitorWss.emit('connection', ws, request)
      //   })
      //   return
      // }

    }

    socket.destroy()

  } catch (e) {

    logger.error(e)
    socket.destroy()

  }

}