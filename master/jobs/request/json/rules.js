const eParams = require('../../../config').executionParams

module.exports = {

  available: {
    maxMemory: {type: Number, required: true, range: `${eParams.memory.min}-${eParams.memory.max}`}
  },

  request: {
    maxTime: {type: Number, required: true, range: `${eParams.time.min}-${eParams.time.max}`},
    maxFileSize: {type: Number, required: true},
    maxMemory: {type: Number, required: true, range: `${eParams.memory.min}-${eParams.memory.max}`},
    maxProcesses: {type: Number, required: true},
    userId: {type: String, required: true},
    activityId: {type: String, required: true},
    execute: {type: String, required: true},
    interactive: {type: Number, required: true},
    lang: {type: String, required: true},
    files: {
      type: Array,
      schema: {
        name: {type: String, required: true},
        content: {type: String, required: true}
      }
    }
  },
}