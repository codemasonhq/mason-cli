const {Command} = require('../../base')
const helpers = require('../../util/helpers')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class AppsIndexCommand extends Command {
  async run() {
    this.log('Your apps (' + chalk.green(_.get(this.config, 'userConfig.team.slug')) + ')')

    const apps = await this.getApps().catch(e => {
      this.error(e)
    })

    _.each(apps, app => this.log(` ${app.name}`))
  }

  async getApps() {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    return axios.get(`${endpoint}/v1/${team}/applications?api_token=${token}`)
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
