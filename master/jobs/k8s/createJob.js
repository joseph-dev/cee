const k8s = require('../../k8s')

module.exports = async (jobName, runnerVersion, executionId) => {

  return await k8s.axios.post(`/batch/v1/namespaces/${k8s.namespace}/jobs`, {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName
    },
    spec: {
      ttlSecondsAfterFinished: 0, // Requires 'TTLAfterFinished' feature gate to be enabled
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
              ]
            }
          ],
          restartPolicy: "Never"
        }
      },
      backoffLimit: 1
    }
  }, {httpsAgent: k8s.httpsAgent})

}