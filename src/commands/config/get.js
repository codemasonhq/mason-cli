const {Command} = require('@oclif/command')

class ConfigGet extends Command {

	async run() {
    	const {args} = this.parse(ConfigGet);
		this.log(this.config.userConfig[args.key]);
	}

}

ConfigGet.args = [
	{
		name: 'key',
		required: true,
	}
]

ConfigGet.description = 'get cli config value'

module.exports = ConfigGet