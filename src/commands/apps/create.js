const {Command, flags} = require('../../base')
const helpers = require('../../util/helpers')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class AppsCreateCommand extends Command {
  async run() {
    const {args} = this.parse(AppsCreateCommand)
    const {flags} = this.parse(AppsCreateCommand)

    this.log('Creating app on Codemason...')

    await this.createApp(args.name, flags.environment).catch(e => {
      this.error(e)
    })

    if (!flags['no-remote']) {
      await this.createRemote(args.name, flags.remote).catch(e => {
        this.error(e)
      })
    }
  }

  async createApp(name, environment) {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    return axios.post(`${endpoint}/v1/${team}/applications?environment=${environment}&api_token=${token}`, {
      masonVersion: 'v1',
      type: 'application',
      name: name,
    })
    .then(() => {
      this.log(chalk.grey(' ... Created application'))
      this.log(chalk.grey(' ... Created remote repository'))
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }

  async createRemote(name, remote) {
    try {
      const team =  _.get(this.config, 'userConfig.team.slug').toLowerCase()
      const git = _.get(this.config, 'userConfig.git')

      helpers.createGitRemote(git, team, name.toLowerCase(), remote)
      this.log(chalk.grey(` ... Added git remote ${remote}`))
      return
    } catch (e) {
      this.warn('Could not add git remote')
      this.warn(e.message)
    }
  }
}

AppsCreateCommand.aliases = [
  'create',
]

AppsCreateCommand.args = [
  {
    name: 'name',
    required: true,
  },
]

AppsCreateCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment to create the app in',
    default: 'development',
  }),
  remote: flags.string({
    char: 'r',
    description: 'the git remote to create',
    default: 'codemason',
  }),
  'no-remote': flags.boolean({
    char: 'n',
    description: 'do not add a git remote',
  }),
}

AppsCreateCommand.description = 'create a new app'

module.exports = AppsCreateCommand
