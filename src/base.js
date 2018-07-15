const {Command, flags} = require('@oclif/command')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

let defaultConfig = {
  endpoint: 'https://codemason.io',
  registry: 'registry.mason.ci',
  git: 'git.mason.ci',
  remote: 'codemason',
}

class BaseCommand extends Command {
  async init() {
    try {
      this.config.userConfig = _.merge(defaultConfig, fs.readJsonSync(path.join(this.config.configDir, 'config.json')))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      this.config.userConfig = defaultConfig
    }
  }
}

module.exports = {
  Command: BaseCommand,
  flags: flags,
}
