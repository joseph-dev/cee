const {transports, createLogger, format} = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const replaceErrors = (key, value) => {
  if (value instanceof Buffer) {
    return value.toString()
  } else if (value instanceof Error) {
    let error = {}

    Object.getOwnPropertyNames(value).forEach(function (key) {
      error[key] = value[key]
    })

    return error
  }

  return value
}

module.exports = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json({ replacer: replaceErrors })
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'log-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
})