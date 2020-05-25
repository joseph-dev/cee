const k8s = require('../../k8s')

module.exports = async (jobName) => {

  let data

  const response = await k8s.axios.get(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs/${jobName}`, {
    validateStatus: (status) => {
      return [200, 404].includes(status)
    }
  })

  if (response.status === 200) {
    data = response.data
  }

  return data

}