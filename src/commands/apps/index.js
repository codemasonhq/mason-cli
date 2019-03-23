const {Command} = require('../../base')
const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class AppsIndexCommand extends Command {
  async run() {
    this.log('Your apps (' + chalk.green(_.get(this.config, 'userConfig.team.slug')) + ')')

    const apps = await this.getApps(_.get(this.config, 'userConfig.team.slug')).catch(e => {
      this.error(e)
    })

    _.each(apps, app => this.log(` ${app.name}`))
  }

  async getApps(team) {
    return this.codemason.get(`/${team}/apps`)
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

AppsIndexCommand.description = 'list your apps'

module.exports = AppsIndexCommand
