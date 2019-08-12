const {Command} = require('../../base')

const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class TeamsIndexCommand extends Command {
  async run() {
    this.log('Your teams (' +  chalk.grey(_.get(this.config, 'userConfig.user.email')) + ')')

    const teams = await this.getTeams().catch(e => {
      this.error(e)
    })

    _.each(teams, team => this.log(` ${team.slug}`))
  }

  async getTeams() {
    return this.codemason.get('/teams')
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

TeamsIndexCommand.description = 'lists the teams you are a member of'

module.exports = TeamsIndexCommand
