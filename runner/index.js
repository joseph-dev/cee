const sh = require('shelljs')
const fs = require('fs')
const program = require('commander')
const redis = require('./redis')

// Function for processing execution
let execute = async (executionId) => {

  let result = {
    success: true,
    output: ''
  }

  let folderPath = sh.tempdir()

  try {

    // get params from Redis
    const paramsJson = await redis.hGetAsync('execRequests', executionId)
    if (! paramsJson) {
      throw new Error(`Invalid request`)
    }
    const params = JSON.parse(paramsJson)

    // write all of the files
    for (let file of params.files) {
      fs.writeFileSync(`${folderPath}/${file.name}`, file.content)
    }

    // change dir to where the files are and execute the needed files
    sh.cd(folderPath)

    if (! sh.test('-e', params.execute)) {
      throw new Error(`File "${params.execute}" doesn't exist`)
    }
    sh.chmod('u+x', params.execute)
    sh.exec('./' + params.execute)

    if (! sh.test('-e', 'vpl_execution')) {
      throw new Error(`File "vpl_execution" doesn't exist`)
    }
    const finalResult = sh.exec('./vpl_execution')

    if (finalResult.stdout) {
      result.output = finalResult.stdout
    }

    if (finalResult.stderr) {
      result.output = finalResult.stderr
    }

  } catch (e) {

    result.success = false // @TODO add logging

  } finally {

    // delete unnecessary files and go back to the home dir
    sh.rm('-rf', `${folderPath}/*`)
    sh.cd('/app')
    redis.hset('execResults', executionId, JSON.stringify(result))
    redis.quit()
  }

}

// Declare and parse cl parameters
program.requiredOption("--execution-id <id>", "Execution ID", parseInt)
program.parse(process.argv)

if (isNaN(program.executionId)){
  throw new Error(`Invalid value for '--execution-id'`)
}

// process
execute(program.executionId)