const {Command, flags} = require('@oclif/command')
const helpers = require('../../util/helpers')
var child = require('child_process')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class AppsCreateCommand extends Command {
    
    async run() {

        const {args} = this.parse(AppsCreateCommand);
        const {flags} = this.parse(AppsCreateCommand)
        
        this.log("Creating app on Codemason...");

        await this.createApp(args.name).catch((e) => {
            this.error(e);
        });

        await this.createGit(args.name).catch((e) => {
            this.error(e);
        });

    }

    async createApp(name) {

        var endpoint = _.get(this.config, 'userConfig.endpoint');
        var team = _.get(this.config, 'userConfig.team.slug');
        var token = _.get(this.config, 'userConfig.user.token');

        return axios.post(`${endpoint}/v1/${team}/applications?api_token=${token}`, {
                masonVersion: "v1",
                type: "application",
                name: name
            })
            .then((response) => {
                this.log(chalk.grey(" ... Created application"))
                this.log(chalk.grey(" ... Created remote repository"))
                return;
            })
            .catch((error) => {

                if(_.has(error, 'response.data')) { 
                    throw helpers.parseApiError(error.response.data);
                }

                throw error.toString().replace('Error: ', '');
                
            })

    }

    async createGit(name) {
        try {
            child.execSync('git remote add codemason git@git.mason.ci:' + _.get(this.config, 'userConfig.team.slug').toLowerCase() + '/' + name.toLowerCase(), {stdio: 'pipe'});
            this.log(chalk.grey(" ... Added git remote codemason"))
            return
        } catch(e) {
            this.warn("Could not add git remote");
            this.warn(e.message);
        }
    }
}

AppsCreateCommand.aliases = [
    'create'
]

AppsCreateCommand.args = [
    {
        name: 'name',
        required: true,
    },
]

AppsCreateCommand.flags = {
    environment: flags.string({char: 'e', description: 'the environment to create the app in'}),
    remote: flags.string({char: 'r', default: 'codemason', description: 'the git remote to create'})
}

module.exports = AppsCreateCommand
