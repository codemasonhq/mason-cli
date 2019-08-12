const {Command, flags} = require('../../base')
const helpers = require('../../util/helpers')
const inquirer = require('inquirer') // eslint-disable-line node/no-extraneous-require
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

class TeamsSwitchCommand extends Command {
  async run() {
    const {flags} = this.parse(TeamsSwitchCommand)
    const teams = await this.getTeams().catch(e => {
      this.error(e)
    })

    // Get the new default team
    let team = flags.team
    if (!team) {
      let responses = await inquirer.prompt([{
        name: 'team',
        message: 'Select your preferred default team',
        type: 'list',
        choices: _.map(teams, team => team.slug),
      }])
      team = responses.team
    }

    // Update the config file
    const config = this.config.userConfig
    _.set(config, 'team.slug', team)
    await fs.outputJSON(path.join(this.config.configDir, 'config.json'), config, {spaces: 2})

    this.log(chalk.grey(' ... Default team successfully changed'))
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

TeamsSwitchCommand.description = 'set your default team'

TeamsSwitchCommand.flags = {
  team: flags.string(),
}

module.exports = TeamsSwitchCommand
