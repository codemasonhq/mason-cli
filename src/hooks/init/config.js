const Config = require('../../config')

module.exports = async function (opts) {
	const config = new Config(this.config.configDir);
    this.config.userConfig = await config.all();
    this.config.UserConfig = config;
}
