const k8s = require('../../k8s')

module.exports = async (jobName, runnerVersion, executionId, params) => {

  return await k8s.axios.post(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`, {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName
    },
    spec: {
      ttlSecondsAfterFinished: 0, // Requires 'TTLAfterFinished' feature gate to be enabled
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
                `--execution-id=${executionId}`
              ],
              resources: {
                requests: {
                  memory: params.maxMemory
                },
                limits: {
                  memory: params.maxMemory
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