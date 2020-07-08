const k8s = require('../../k8s')

module.exports = async (podName) => {

  let data

  const response = await k8s.axios.delete(`/api/v1/namespaces/${k8s.namespace}/pods/${podName}`, {
    params: {
      propagationPolicy: 'Background'
    },
    validateStatus: (status) => {
      return [200, 202, 404].includes(status)
    }
  })

  if (response.status !== 404) {
    data = response.data
  }

  return data

}