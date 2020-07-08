const k8s = require('../../k8s')

module.exports = async () => {

  const response = await k8s.axios.get(`/api/v1/namespaces/${k8s.namespace}/pods`, { // @TODO check what kind of pods should be fetched
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data.items

}