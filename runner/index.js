const sh = require('shelljs')
const fs = require('fs')
const program = require('commander')
const redis = require('./redis')

const REDIS_REQUEST_SET = 'requests'
const REDIS_RESULT_SET = 'results'
const EXECUTION_FILE = 'vpl_execution'

// Function for processing the execution
let execute = async (requestId) => {

  let result = {
    success: true,
    output: ''
  }

  try {

    let folderPath = sh.tempdir()
    let finalResult

    // get params from Redis
    const paramsJson = await redis.hGetAsync(REDIS_REQUEST_SET, requestId)
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
    finalResult = sh.exec('./' + params.execute)

    if (sh.test('-e', EXECUTION_FILE)) {
      finalResult = sh.exec(`./${EXECUTION_FILE}`)
    }

    if (finalResult.stdout) {
      result.output = finalResult.stdout
    }

    if (finalResult.stderr) {
      result.output = finalResult.stderr
    }

  } catch (e) {

    console.log(e)
    result.success = false

  } finally {

    // Set the result only if the request has not been processed yet and there is no other result in redis
    if (await redis.hExistsAsync(REDIS_REQUEST_SET, requestId)) {
      redis.hsetnx(REDIS_RESULT_SET, requestId, JSON.stringify(result))
    }
    redis.quit()
  }

}

// Declare and parse cl parameters
program.requiredOption("--request-id <id>", "Request ID", parseInt)
program.parse(process.argv)

if (isNaN(program.requestId)){
  throw new Error(`Invalid value for '--request-id'`)
}

// process
execute(program.requestId)