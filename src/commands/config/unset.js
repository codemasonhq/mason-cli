const {Command} = require('@oclif/command')
const Config = require('../../config')

class ConfigUnsetCommand extends Command {

    async run() {
        const {args} = this.parse(ConfigUnsetCommand);
        const config = new Config(this.config.configDir);

        config.unset(args['key']);
        this.log("Setting " + args['key'] + "... done")
    }

}

ConfigUnsetCommand.args = [
    {
        name: 'key',
        required: true,
    }
]

ConfigUnsetCommand.description = 'unset a cli config value'

module.exports = ConfigUnsetCommand