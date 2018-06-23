const {Command} = require('../../base')

const fs = require('fs-extra')
const path = require('path')

class ConfigUnsetCommand extends Command {

    async run() {

        const {args} = this.parse(ConfigUnsetCommand);
        const config = this.config.userConfig;

        delete config[args['key']];
        await fs.outputJSON(path.join(this.config.configDir, 'config.json'), config, {spaces: 2});
        this.log("Unsetting " + args['key'] + "... done")

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