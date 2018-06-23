const {Command, flags} = require('@oclif/command')
const fs = require('fs-extra')
const path = require('path')

let defaultConfig = {
    endpoint: 'https://codemason.io',
    registry: 'registry.mason.ci',
    git: 'git.mason.ci',
    remote: 'codemason'
}

class BaseCommand extends Command {

    async init(err) {
        
        try {
            this.config.userConfig = await fs.readJSON(path.join(this.config.configDir, 'config.json'))
        } catch (err) {
            if (err.code !== 'ENOENT') throw err
            this.config.userConfig = defaultConfig;
        }

    }

}

module.exports = {
    Command: BaseCommand,
    flags: flags,
}
