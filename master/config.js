module.exports = {
  network: {
    port: parseInt(process.env.MASTER_SERVICE_PORT) || 80,
    securePort: parseInt(process.env.MASTER_SERVICE_SECURE_PORT) || 443,
  }
}