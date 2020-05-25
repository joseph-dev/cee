const k8s = require('../../k8s')

module.exports = async () => {

  const response = await k8s.axios.get(`/api/v1/nodes`, {
    validateStatus: (status) => {
      return status === 200
    }
  })

  return response.data.items

}