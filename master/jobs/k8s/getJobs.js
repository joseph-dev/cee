const k8s = require('../../k8s')

module.exports = async () => {

  const response = await k8s.axios.get(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs`, {
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data.items

}