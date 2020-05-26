const k8s = require('../../k8s')

module.exports = async (jobName, requestId, params) => {

  const response = await k8s.axios.post(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`, {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName
    },
    spec: {
      ttlSecondsAfterFinished: 0, // Requires 'TTLAfterFinished' feature gate should be enabled
      activeDeadlineSeconds: params.maxTime,
      template: {
        spec: {
          containers: [
            {
              name: jobName,
              image: `${process.env.RUNNER_IMAGE}:${params.runner}`,
              command: [
                "node",
                "index.js",
                `--request-id=${requestId}`
              ],
              resources: {
                requests: {
                  "memory": params.maxMemory,
                  "ephemeral-storage": params.maxFileSize, // Requires 'LocalStorageCapacityIsolation' feature gate should be enabled
                },
                limits: {
                  "memory": params.maxMemory,
                  "ephemeral-storage": params.maxFileSize, // Requires 'LocalStorageCapacityIsolation' feature gate should be enabled
                }
              }
            }
          ],
          restartPolicy: "Never",
          terminationGracePeriodSeconds: 0
        }
      },
      backoffLimit: 0,
      completions: 1
    }
  }, {
    validateStatus: (status) => {
      return [200, 201, 202].includes(status)
    }
  })

  return response.data

}