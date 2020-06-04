const fs = require('fs')
const ejs = require('ejs')

module.exports = (apiType, runner, payloadScript) => {

  const template = fs.readFileSync(`./requests/request.${apiType}`).toString()
  const payload = fs.readFileSync(`./payloads/${runner}/${payloadScript}`).toString()
  const entryPoint = fs.readFileSync(`./payloads/${runner}/vpl_run.sh`).toString()

  if (apiType === 'xml') {

    return ejs.render(template, {
      payload: payload,
      entryPoint: entryPoint,
      maxTime: process.env.MAX_TIME,
      maxFileSize: process.env.MAX_FILESIZE,
      maxMemory: process.env.MAX_MEMORY,
    })

  } else if (apiType === 'json') {

    return ejs.render(template, {
      payload: payload.replace(/(\r\n|\n|\r)/gm, "\\n").replace(/"/gm, "\\\""),
      entryPoint: entryPoint.replace(/(\r\n|\n|\r)/gm, "\\n").replace(/"/gm, "\\\""),
      maxTime: process.env.MAX_TIME,
      maxFileSize: process.env.MAX_FILESIZE,
      maxMemory: process.env.MAX_MEMORY,
    })

  } else {

    throw new Error(`Invalid API type: ${apiType}`)

  }

}