const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello from runner!'))

app.listen(port, () => console.log(`Runner listening on port ${port}!`))