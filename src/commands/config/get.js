const {Command} = require('../../base')

class ConfigGetCommand extends Command {
  async run() {
    const {args} = this.parse(ConfigGetCommand)
    this.log(this.config.userConfig[args.key])
  }
}

ConfigGetCommand.args = [
  {
    name: 'key',
    required: true,
  },
]

ConfigGetCommand.description = 'get cli config value'

module.exports = ConfigGetCommand
