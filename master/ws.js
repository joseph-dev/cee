const util = require('util')
events = require('events')
const WebSocket = require('ws')

const ws = function(url, options) {
  this.url                    = url && url.indexOf("ws") == -1 ? "ws://"+url : url
  this.options                = options || {}
  this.socket                 = null
  this.isConnected            = false
  this.reconnectTimeoutId     = 0
  this.retryCount             = this.options.retryCount || -1
  this._retryCount            = this.retryCount
  this.reconnectInterval      = this.options.reconnectInterval !== undefined ? this.options.reconnectInterval : 100
  this.shouldAttemptReconnect = !!this.reconnectInterval

  this.start = function () {
    this.shouldAttemptReconnect = !! this.reconnectInterval;
    this.isConnected      = false;
    this.socket           = new WebSocket(this.url);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onopen    = this.onOpen.bind(this);
    this.socket.onerror   = this.onError.bind(this);
    this.socket.onclose   = this.onClose.bind(this);
  }

  this.destroy = function () {
    clearTimeout(this.reconnectTimeoutId)
    this.shouldAttemptReconnect = false
    this.socket.close()
  }

  this.onError = function (reason) {
    // hook before close
  }

  this.onOpen = function () {
    this.isConnected = true
    this.emit("connect")
    this.retryCount = this._retryCount
  }

  this.onClose = function (reason) {
    if (this.shouldAttemptReconnect && (this.retryCount > 0 || this.retryCount === -1)) {
      if (this.retryCount !== -1) this.retryCount--
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = setTimeout(function () {
        this.emit("reconnect")
        this.start()
      }.bind(this), this.reconnectInterval)
    } else {
      this.emit("destroyed")
    }
  }

  this.onMessage = function(message) {
    this.emit("message",message.data)
  }

  this.send = function(message) {
    this.socket.send(message)
  }

}

util.inherits(ws, events.EventEmitter)
module.exports = ws