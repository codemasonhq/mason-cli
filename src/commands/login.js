const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')

const helpers = require('../util/helpers')
const child = require('child_process')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')
const os = require('os')


/**
 * Path to users ssh key
 */
let sshKeyPath = helpers.getUserHome() + "/.ssh/id_rsa";


class LoginCommand extends Command {
    async run() {

        const {flags} = this.parse(LoginCommand);

        this.log("Login to your Codemason account");

        const email = await cli.prompt('Email', {default: _.get(this.config, 'userConfig.user.email')});
        const password = await cli.prompt('Password', {type: 'hide'});

        const token = await this.authenticate(email, password).catch((e) => {
            this.error(e);
        });

        await this.uploadKey().catch((e) => {
            this.error(e);
        });

        this.log("Logged in as " + chalk.green(_.get(this.config, 'userConfig.user.email')));
    
    }

    /**
     * Authenticate the user and store get a JWT token
     */
    async authenticate(email, password) {
        return axios.post(`${_.get(this.config, 'userConfig.endpoint')}/v1/token`, {
                email: email,
                password: password,
                token_name: "Mason CLI - " + os.hostname().split('.').shift(),
            })
            .then((response) => {
                this.config.userConfig.user = {..._.get(response, 'data.user', {}), ..._.pick(_.get(response, 'data', {}), 'token')}
                this.config.userConfig.team = _.pick(_.get(response, 'data.team', {}), ['slug', 'current_billing_plan'])
                this.config.UserConfig.save(this.config.userConfig);
                return _.get(response, 'data.token');
            })
            .catch((error) => {

                if(_.has(error, 'response.data')) { 
                    throw helpers.parseApiError(error.response.data);    
                }

                throw error.toString().replace('Error: ', '');
                
            })
    }

    /** 
     * Upload their public SSH key to Codemason
     * so user's machine is recognised by git
     */
    async uploadKey() {

        // TODO: Fix this so it works on Windows too(?)
        function generateKey() {
            child.execSync("ssh-keygen -t rsa -f " + sshKeyPath + " -q -N ''");
            return helpers.getSSHKey(sshKeyPath);
        }

        var key = helpers.getSSHKey(sshKeyPath);
        if(key == false) {
            this.warn("Could not find an existing public key");
            this.log("Generating new SSH public key");
            key = generateKey();
        }

        return axios.post(`${_.get(this.config, 'userConfig.endpoint')}/v1/git/keys`, {
                api_token: _.get(this.config, 'userConfig.user.token'),
                title: os.hostname(),
                key: key
            })
            .then((response) => {
                return _.get(response, 'data.token');
            })
            .catch((error) => {

                // Don't alert the user if the key has already been added
                if(_.flatten(_.toArray(_.get(error, 'response.data'))).indexOf("\"fingerprint\" has already been taken") !== -1) {
                    return;
                }

                // Report API errors
                if(_.has(error, 'response.data')) { 
                    throw helpers.parseApiError(error.response.data);    
                }

                throw error.toString().replace('Error: ', '');

            })

    }

}

LoginCommand.description = 'login to your Codemason account'

LoginCommand.flags = {
    email: flags.string({char: 'e', description: 'email'}),
    password: flags.string({char: 'p', description: 'password'}),
}

module.exports = LoginCommand
