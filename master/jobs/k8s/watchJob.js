const k8s = require('../../k8s')

module.exports = async (jobName) => {

  return await k8s.axios.get(`/batch/v1/namespaces/${k8s.namespace}/jobs?fieldSelector=metadata.name=${jobName}&watch`, {
    httpsAgent: k8s.httpsAgent,
    responseType: 'stream'
  })

}