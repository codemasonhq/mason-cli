const {Command} = require('@oclif/command')
const Config = require('../../config')

class ConfigSetCommand extends Command {

    async run() {
        const {args} = this.parse(ConfigSetCommand);
        const config = new Config(this.config.configDir);

        config.set(args['key'], args['value']);
        this.log("Setting CLI config value... done")
    }

}

ConfigSetCommand.args = [
    {
        name: 'key',
        required: true,
    },
    {
        name: 'value',
        required: true,
    }
]

ConfigSetCommand.description = 'set a cli config value'

module.exports = ConfigSetCommand