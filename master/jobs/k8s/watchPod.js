const k8s = require('../../k8s')

module.exports = async (podName) => {

  const response = await k8s.axios.get(`/api/v1/namespaces/${k8s.namespace}/pods`, {
    params: {
      fieldSelector: `metadata.name=${podName}`,
      watch: true
    },
    responseType: 'stream',
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data

}