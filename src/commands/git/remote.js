const {Command, flags} = require('../../base')
const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class GitRemoteCommand extends Command {

	async run() {
        
        const {args} = this.parse(GitRemoteCommand);
        const {flags} = this.parse(GitRemoteCommand);
        const remote = flags.remote;

        try {

            var team =  _.get(this.config, 'userConfig.team.slug').toLowerCase();
            var git = _.get(this.config, 'userConfig.git');
            var name = args['app'].toLowerCase();

            helpers.createGitRemote(git, team, name, remote)
            this.log(`Remote ${chalk.cyan(remote)} added as ${chalk.cyan(`git@${git}:${team}/${name.toLowerCase()}`)}`);
            return;

        } catch(e) {
            this.warn("Could not add git remote");
            this.warn(e.message);
        }
	}

}

GitRemoteCommand.args = [
    {
        name: 'app',
        required: true,
    },
]

GitRemoteCommand.flags = {
    remote: flags.string({
        char: 'r', 
        description: 'name to give git remote',
        default: (cli) => {
            return _.get(cli.config, 'userConfig.remote');
        }
    }),
}

GitRemoteCommand.description = 'add a git remote'

module.exports = GitRemoteCommand
