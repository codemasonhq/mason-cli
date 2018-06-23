const {Command} = require('../../base')

const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

class ConfigSetCommand extends Command {

    async run() {
        
        const {args} = this.parse(ConfigSetCommand);
        const config = this.config.userConfig;

        _.set(config, args['key'], args['value']);
        await fs.outputJSON(path.join(this.config.configDir, 'config.json'), config, {spaces: 2});
        this.log("Setting CLI config value... done");

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