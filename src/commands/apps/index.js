const {Command, flags} = require('../../base')
const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class AppsIndexCommand extends Command {
  async run() {
    const {flags} = this.parse(AppsIndexCommand)

    this.log('Your apps (' + chalk.green(_.get(this.config, 'userConfig.team.slug')) + ')')

    const apps = await this.getApps(flags.environment).catch(e => {
      this.error(e)
    })

    _.each(apps, app => this.log(` ${app.name}`))
  }

  async getApps(environment) {
    var team = _.get(this.config, 'userConfig.team.slug')
    return this.codemason.get(`/${team}/applications?environment=${environment}`)
    .then(response => {
      return _.get(response, 'data')
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }
}

AppsIndexCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment of apps to list',
    default: 'development',
  }),
}

AppsIndexCommand.description = 'list your apps'

module.exports = AppsIndexCommand
