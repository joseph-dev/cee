const k8s = require('../../k8s')
const config = require('../../config')

module.exports = async (podName, requestId, params) => {

  const response = await k8s.axios.post(`/api/v1/namespaces/${k8s.namespace}/pods`, {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: podName,
      labels: {
        app: "runner"
      }
    },
    spec: {
      activeDeadlineSeconds: params.maxTime,
      restartPolicy: "Never",
      terminationGracePeriodSeconds: 0,
      serviceAccountName: "runner",
      containers: [
        {
          name: podName,
          image: `${process.env.RUNNER_IMAGE}:${params.runner}`,
          imagePullPolicy: config.cee.runnerPullPolicy,
          command: [
            "node",
            "index.js",
            `--request-id=${requestId}`
          ],
          resources: {
            requests: {
              "memory": params.maxMemory,
              "ephemeral-storage": params.maxFileSize, // Requires 'LocalStorageCapacityIsolation' feature gate should be enabled
              "cpu": config.executionParams.cpu.request,
            },
            limits: {
              "memory": params.maxMemory,
              "ephemeral-storage": params.maxFileSize, // Requires 'LocalStorageCapacityIsolation' feature gate should be enabled
              "cpu": config.executionParams.cpu.limit,
            }
          }
        }
      ]
    }
  }, {
    validateStatus: (status) => {
      return [200, 201, 202].includes(status)
    }
  })

  return response.data

}