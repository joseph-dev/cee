const redis = require("redis")
const logger = require("./logger")
const {promisify} = require('util');
const client = redis.createClient(process.env.REDIS_SERVICE_PORT, process.env.REDIS_SERVICE_HOST)

client.on('error', function (err) {
  logger.error(err)
});

client.on('connect', function () {
  logger.info('Connected to the Redis server')
});

client.REQUEST_SET = 'requests'
client.RESULT_SET = 'results'
client.EXECUTION_TICKET_SET = 'executionTickets'
client.MONITOR_TICKET_SET = 'monitorTickets'
client.ADMIN_TICKET_SET = 'adminTickets'

client.hSetAsync = promisify(client.hset).bind(client)
client.hGetAsync = promisify(client.hget).bind(client)
client.hDelAsync = promisify(client.hdel).bind(client)
client.hExistsAsync = promisify(client.hexists).bind(client)
client.hSetNxAsync = promisify(client.hsetnx).bind(client)

module.exports = client