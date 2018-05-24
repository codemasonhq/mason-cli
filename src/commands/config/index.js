const {Command} = require('@oclif/command')

class ConfigIndex extends Command {

    async run() {
        this.log(this.config.userConfig);
    }

}

ConfigIndex.description = 'list cli config'

module.exports = ConfigIndex