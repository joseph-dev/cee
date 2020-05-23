module.exports = {

  available: {
    maxmemory: {template: 'integer'}
  },

  request: {
    maxtime: {template: 'integer'},
    maxfilesize: {template: 'integer'},
    maxmemory: {template: 'integer'},
    maxprocesses: {template: 'integer'},
    userid: {template: 'string'},
    activityid: {template: 'string'},
    execute: {template: 'string'},
    interactive: {template: 'integer'},
    lang: {template: 'string'},
    files: {template: 'files'}
  },

  getresult: {
    adminticket: {template: 'string'},
  }
}