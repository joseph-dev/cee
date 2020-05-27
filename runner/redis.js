const redis = require("redis")
const {promisify} = require('util');
const client = redis.createClient(process.env.REDIS_SERVICE_PORT, process.env.REDIS_SERVICE_HOST)

client.on('error', function (err) {
  console.log(err)
});

client.on('connect', function () {
  console.log('Connected to the Redis server')
});

client.hGetAsync = promisify(client.hget).bind(client)
client.hExistsAsync = promisify(client.hexists).bind(client)

module.exports = client