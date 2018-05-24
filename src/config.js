const Config = require('@oclif/config')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

let defaultConfig = {
    endpoint: 'https://codemason.io',
    registry: 'registry.mason.ci',
    git: 'git.mason.ci',
    remote: 'codemason'
}

class UserConfig { 

    constructor(configDir) {
        this.configDir = configDir;
    }

    get file() {
        return path.join(this.configDir, 'config.json')
    }

    async read() {
        try {
            return await fs.readJSON(path.join(this.configDir, 'config.json'));
        } catch (err) {
            if (err.code !== 'ENOENT') throw err
            return defaultConfig;
        }
    }

    async all() {
        return await this.read();
    }

    async get(key) {
        return _.get(await this.all(), key);
    }

    async set(key, value) {
        var config = await this.all();
        _.set(config, key, value);
        this.save(config);
    }

    async unset(key) {
        const config = await this.all();
        delete config[key];
        this.save(config);
    }

    async save(config) {
        return await fs.outputJSON(this.file, config, {spaces: 2})
    }

}

module.exports = UserConfig;