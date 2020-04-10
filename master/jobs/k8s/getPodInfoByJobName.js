const k8s = require('../../k8s')

module.exports = async (jobName) => {

  let response = await k8s.axios.get(`/api/v1/namespaces/${k8s.namespace}/pods?labelSelector=job-name=${jobName}`, {
    httpsAgent: k8s.httpsAgent
  })

  let info = null
  if (response.status === 200) {
    info = response.data.items[0]
  }

  return info

}