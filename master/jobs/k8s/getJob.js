const k8s = require('../../k8s')

module.exports = async (jobName) => {

  return await k8s.axios.get(`/apis/batch/v1/namespaces/${k8s.namespace}/jobs/${jobName}`)

}