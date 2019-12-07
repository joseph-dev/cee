let runners = (process.env.RUNNERS || "").split(',')

runners = runners.map(runner => runner.trim())
runners = runners.filter(runner => runner)

module.exports = runners