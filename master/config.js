module.exports = {
  network: {
    port: parseInt(process.env.MASTER_SERVICE_PORT) || 80,
    securePort: parseInt(process.env.MASTER_SERVICE_SECURE_PORT) || 443,
    runnerPort: parseInt(process.env.RUNNER_PORT) || 3000,
  },
  cee: {
    executionRequestTtl: parseInt(process.env.EXECUTION_REQUEST_TTL) || 60000, // ttl (milliseconds) for the request ot be stored if it's not executed
    executionResultTtl: parseInt(process.env.EXECUTION_RESULT_TTL) || 60000 // ttl (milliseconds) for the result ot be stored after interactive execution
  },
  executionParams: {
    time: { // DEFAULT: 1 to 60 seconds
      min: 1,
      max: process.env.EXECUTION_TIME_LIMIT || 60
    },
    memory: { // DEFAULT: 4 to 64 MiB
      min: 4194304,
      max: process.env.EXECUTION_MEMORY_LIMIT || 67108864
    },
    storage: { // DEFAULT: 1 B to 64 MiB
      min: 1,
      max: process.env.EXECUTION_STORAGE_LIMIT || 67108864
    },
    cpu: { // DEFAULT: from '200 milli cores' to '200 milli cores' (format: 1 - one core, 500m - 0.5 core)
      request: process.env.EXECUTION_CPU_REQUEST || '100m',
      limit: process.env.EXECUTION_CPU_LIMIT || '200m'
    },
    processes: { // 1 to 64
      min: 1,
      max: 64
    }
  }
}