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
    memory: { // 4 to 100 MiB
      min: 4194304,
      max: 104857600
    }
  }
}