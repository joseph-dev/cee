const eParams = require('../../../config').executionParams
const redis = require('../../../redis')

module.exports = {

  available: {
    maxMemory: {type: Number, required: true, range: `${eParams.memory.min}-${eParams.memory.max}`}
  },

  request: {
    maxTime: {type: Number, required: true, range: `${eParams.time.min}-${eParams.time.max}`},
    maxFileSize: {type: Number, required: true, range: `${eParams.storage.min}-${eParams.storage.max}`},
    maxMemory: {type: Number, required: true, range: `${eParams.memory.min}-${eParams.memory.max}`},
    execute: {type: String, required: true},
    interactive: {type: Boolean, required: true},
    files: {
      type: Array,
      schema: {
        name: {type: String, required: true},
        content: {type: String, required: true}
      }
    }
  },

  getresult: {
    adminticket: {type: Number, required: true, post: async (adminticket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminticket)) {
          throw new Error("The adminticket is not valid.")
        }
      }
    }
  },

  running: {
    adminticket: {type: Number, required: true, post: async (adminticket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminticket)) {
          throw new Error("The adminticket is not valid.")
        }
      }
    }
  },

  stop: {
    adminticket: {type: Number, required: true, post: async (adminticket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminticket)) {
          throw new Error("The adminticket is not valid.")
        }
      }
    }
  }
}