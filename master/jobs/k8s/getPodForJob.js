const k8s = require('../../k8s')

module.exports = async (jobName) => {

  const response = await k8s.axios.get(`/api/v1/namespaces/${k8s.namespace}/pods`, {
    params: {
      labelSelector: `job-name=${jobName}`
    },
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data.items[0]

}