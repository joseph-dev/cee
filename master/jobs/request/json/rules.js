module.exports = {

  available: {
    maxMemory: {type:  Number, required: true}
  },

  request: {
    maxTime: {type: Number, required: true},
    maxFileSize: {type: Number, required: true},
    maxMemory: {type: Number, required: true},
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