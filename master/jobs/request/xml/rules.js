const redis = require('../../../redis')

module.exports = {

  available: {
    maxmemory: {template: 'int'}
  },

  request: {
    maxtime: {template: 'int'},
    maxfilesize: {template: 'int'},
    maxmemory: {template: 'int'},
    maxprocesses: {template: 'int'},
    userid: {template: 'string'},
    activityid: {template: 'string'},
    execute: {template: 'string'},
    interactive: {template: 'int'},
    lang: {template: 'string'},
    files: {template: 'files'}
  },

  getresult: {
    adminticket: {template: 'string', post: async (adminticket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminticket)) {
          throw new Error("The adminticket is not valid.")
        }
      }
    },
  },

  running: {
    adminticket: {template: 'string', post: async (adminticket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminticket)) {
          throw new Error("The adminticket is not valid.")
        }
      }
    },
  }
}