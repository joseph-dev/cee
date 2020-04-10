const fs = require('fs')
const https = require('https')
const axios = require('axios')

const kubeApiBaseUrl = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_PORT_443_TCP_PORT}`
const kubeToken = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token').toString()
const caCrt = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')

module.exports = {
  namespace: process.env.KUBERNETES_NAMESPACE,
  axios: axios.create({
    baseURL: kubeApiBaseUrl,
    headers: {
      "Authorization": `Bearer ${kubeToken}`
    }
  }),
  httpsAgent: new https.Agent({ca: caCrt, keepAlive: false})
}