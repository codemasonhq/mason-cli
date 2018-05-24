const {Command} = require('@oclif/command')
const Config = require('../../config')

class ConfigUnset extends Command {

    async run() {
        const {args} = this.parse(ConfigUnset);
        const config = new Config(this.config.configDir);

        config.unset(args['key']);
        this.log("Setting " + args['key'] + "... done")
    }

}

ConfigUnset.args = [
    {
        name: 'key',
        required: true,
    }
]

ConfigUnset.description = 'unset a cli config value'

module.exports = ConfigUnset