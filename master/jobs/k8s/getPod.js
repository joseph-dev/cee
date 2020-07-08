const k8s = require('../../k8s')

module.exports = async (podName) => {

  let data

  const response = await k8s.axios.get(`/api/v1/namespaces/${k8s.namespace}/pods/${podName}`, {
    validateStatus: (status) => {
      return [200, 404].includes(status)
    }
  })

  if (response.status === 200) {
    data = response.data
  }

  return data

}