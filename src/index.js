#!/usr/bin/env node
let chalk = require('chalk')
let create = require('@architect/create/cli')
let deploy = require('@architect/deploy/cli')
let env = require('@architect/env')
let hydrate = require('@architect/hydrate/cli')
let logs = require('@architect/logs/cli')
let pkg = require('@architect/package/cli')
let repl = require('@architect/repl')
let sandbox = require('@architect/sandbox/src/cli/arc')

let before = require('./before')
let help = require('./help')
let version = require('./version')

let update = require('update-notifier')
let _pkg = require('../package.json')

let cmds = {
  create,
  init: create,
  deploy,
  env,
  help,
  hydrate,
  logs,
  package: pkg,
  repl,
  sandbox,
  version
}

let red = chalk.bgRed.bold.white
let yel = chalk.yellow
let dim = chalk.grey

let pretty = {
  fail(cmd, err) {
    console.log(red(`${cmd} failed!`), err && err.message? yel(err.message) : '')
    if (err && err.message)
      console.log(dim(err.stack))
  },
  notFound(cmd) {
    console.log(dim(`Sorry, ${chalk.green.bold('arc ' +cmd)} command not found!`))
  }
}

async function run ({cmd, opts}) {
  try {
    await cmds[cmd](opts)
  }
  catch(err) {
    pretty.fail(cmd, err)
    process.exit(1)
  }
}

async function main (args) {
  // Mainly here for testing
  args = args || process.argv.slice(2)

  // Set quietude
  process.env.ARC_QUIET = process.env.QUIET || args.some(a => a.includes('-quiet')) ? true : ''

  // Check for updates in a non-blocking background process
  let boxenOpts = {padding: 1, margin: 1, align: 'center', borderColor: 'green', borderStyle: 'round', dimBorder: true}
  update({pkg: _pkg, shouldNotifyInNpmScript: true}).notify({boxenOpts})

  let cmd = args.shift()
  let opts = args.slice(0)

  if (cmd && !cmds[cmd]) {
    pretty.notFound(cmd)
    process.exit(1)
  }
  else if (!cmd || cmd === 'help') {
    help(opts)
  }
  else if (cmd === 'create' || cmd === 'init' || cmd === 'version') {
    run({cmd, opts})
  }
  else {
    // Only run preflight ops on workflows related to existing projects
    try {
      before(cmd)
    }
    catch(err) {
      pretty.fail(cmd, err)
      process.exit(1)
    }
    run({cmd, opts})
  }
}

module.exports = main

// allow direct invoke
if (require.main === module) {
  (async function () {
    await main()
  })()
}
