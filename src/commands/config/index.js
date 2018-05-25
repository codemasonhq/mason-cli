const {Command} = require('@oclif/command')

class ConfigIndexCommand extends Command {

    async run() {
        this.log(this.config.userConfig);
    }

}

ConfigIndexCommand.description = 'list cli config'

module.exports = ConfigIndexCommand