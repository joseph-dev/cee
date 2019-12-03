const express = require('express')
const bodyParser = require('body-parser')
const sh = require('shelljs')
const fs = require('fs')

// Other imports
const redis = require('./redis')

// Create the app
const app = express()
const port = 80

// parse json
app.use(bodyParser.json({ type: 'application/json' }))

// Main endpoint
app.post('/execute/:executionId', async (req, res) => {

  let response = {
    success: true,
    output: ''
  }

  let folderPath

  try {

    // get params from Redis
    const paramsJson = await redis.hGetAsync('execRequests', req.params.executionId);
    if (! paramsJson) {
      throw new Error(`Invalid request`)
    }
    const params = JSON.parse(paramsJson)

    // create temp folder
    folderPath = `${sh.tempdir()}/cee/${req.params.executionId}`
    if (sh.mkdir('-p', folderPath).code !== 0) {
      throw new Error(`Unable to create a folder with path "${folderPath}"`)
    }

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
      response.output = finalResult.stdout
    }

    if (finalResult.stderr) {
      response.output = finalResult.stderr
    }

  } catch (e) {

    response.success = false // @TODO process exception properly

  } finally {

    // go back to the home dir and delete the folder with files
    sh.cd('/app')
    sh.rm('-rf', folderPath)

  }

  res.send(response)

})

app.listen(port, () => console.log(`Runner listening on port ${port}!`))