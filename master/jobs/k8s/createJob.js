const k8s = require('../../k8s')

module.exports = async (jobName, runnerVersion, requestId, params) => {

  return await k8s.axios.post(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`, {
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
              image: `${process.env.RUNNER_IMAGE}:${runnerVersion}`,
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
          restartPolicy: "Never"
        }
      },
      backoffLimit: 0,
      completions: 1
    }
  })

}