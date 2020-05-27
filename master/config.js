module.exports = {
  network: {
    port: parseInt(process.env.MASTER_SERVICE_PORT) || 80,
    securePort: parseInt(process.env.MASTER_SERVICE_SECURE_PORT) || 443,
  },
  cee: {
    executionRequestTtl: parseInt(process.env.EXECUTION_REQUEST_TTL) || 60000, // ttl (milliseconds) for the request ot be stored if it's not executed
    executionResultTtl: parseInt(process.env.EXECUTION_RESULT_TTL) || 60000 // ttl (milliseconds) for the result ot be stored after interactive execution
  },
  executionParams: {
    time: { // 1 to 60 seconds
      min: 1,
      max: 60
    },
    memory: { // 4 to 64 MiB
      min: 4194304,
      max: 67108864
    },
    storage: { // 1 B to 64 MiB
      min: 1,
      max: 67108864
    },
    processes: { // 1 to 64
      min: 1,
      max: 64
    }
  }
}