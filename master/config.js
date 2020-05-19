module.exports = {
  network: {
    port: parseInt(process.env.MASTER_SERVICE_PORT) || 80,
    securePort: parseInt(process.env.MASTER_SERVICE_SECURE_PORT) || 443,
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
    storage: { // 1 to 64 MiB
      min: 1,
      max: 67108864
    },
    processes: { // 1 to 64
      min: 1,
      max: 64
    }
  }
}