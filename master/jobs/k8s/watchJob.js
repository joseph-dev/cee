const k8s = require('../../k8s')

module.exports = async (jobName) => {

  const response = await k8s.axios.get(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`, {
    params: {
      fieldSelector: `metadata.name=${jobName}`,
      watch: true
    },
    responseType: 'stream',
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data

}