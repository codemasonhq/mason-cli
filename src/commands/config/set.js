const {Command} = require('@oclif/command')
const Config = require('../../config')

class ConfigSet extends Command {

    async run() {
        const {args} = this.parse(ConfigSet);
        const config = new Config(this.config.configDir);

        config.set(args['key'], args['value']);
        this.log("Setting CLI config value... done")
    }

}

ConfigSet.args = [
    {
        name: 'key',
        required: true,
    },
    {
        name: 'value',
        required: true,
    }
]

ConfigSet.description = 'set a cli config value'

module.exports = ConfigSet