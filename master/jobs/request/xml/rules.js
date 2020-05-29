const redis = require('../../../redis')

module.exports = {

  available: {
    maxmemory: {template: 'int', as: 'maxMemory'}
  },

  request: {
    maxtime: {template: 'int', as: 'maxTime'},
    maxfilesize: {template: 'int', as: 'maxFileSize'},
    maxmemory: {template: 'int', as: 'maxMemory'},
    maxprocesses: {template: 'int', as: 'maxProcesses'},
    userid: {template: 'string', as: 'userId'},
    activityid: {template: 'string', as: 'activityId'},
    execute: {template: 'string'},
    interactive: {template: 'int'},
    lang: {template: 'string'},
    files: {template: 'files'}
  },

  getresult: {
    adminticket: {template: 'string', as: 'adminTicket', post: async (adminTicket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminTicket)) {
          throw new Error("The admin ticket is not valid.")
        }
      }
    },
  },

  running: {
    adminticket: {template: 'string', as: 'adminTicket', post: async (adminTicket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminTicket)) {
          throw new Error("The admin ticket is not valid.")
        }
      }
    },
  },

  stop: {
    adminticket: {template: 'string', as: 'adminTicket', post: async (adminTicket) => {
        if (! await redis.hExistsAsync(redis.ADMIN_TICKET_SET, adminTicket)) {
          throw new Error("The admin ticket is not valid.")
        }
      }
    },
  }
}