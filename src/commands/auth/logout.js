const {Command, flags} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const child = require('child_process')
const axios = require('axios')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const os = require('os')


/**
 * Path to users ssh key
 */
let sshKeyPath = helpers.getUserHome() + "/.ssh/id_rsa";

class LogoutCommand extends Command {
    async run() {

        cli.action.start(`Logging out of your Codemason account`);

        await this.deleteKey().catch((e) => {
            this.error(e);
        });
        
        await this.clearPersistedData();
        
        cli.action.stop();

    }

    /**
     * Delete the SSH key for this user
     */
    async deleteKey() {
        return axios.delete(`${_.get(this.config, 'userConfig.endpoint')}/v1/git/keys?api_token=${ _.get(this.config, 'userConfig.user.token')}`, {
                params: {
                    title: os.hostname(),
                    key: helpers.getSSHKey(sshKeyPath).toString()
                }
            })
            .catch((error) => {

                if(_.has(error, 'response.data')) { 
                    throw helpers.parseApiError(error.response.data);    
                }

                throw error.toString().replace('Error: ', '');
                
            })
    }

    /**
     * Remove user specific config 
     */
    async clearPersistedData() {
        delete this.config.userConfig.user;
        delete this.config.userConfig.team;
        await fs.outputJSON(path.join(this.config.configDir, 'config.json'), this.config.userConfig, {spaces: 2});
    }

}

LogoutCommand.aliases = [
    'logout'
]

LogoutCommand.description = 'logout of your Codemason account'

module.exports = LogoutCommand
