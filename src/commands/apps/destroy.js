const {Command} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class AppsDestroyCommand extends Command {
  async run() {
    const {args} = this.parse(AppsDestroyCommand)

    cli.action.start(`Destroying ${chalk.cyan(args.name)} (including all services)`)

    await this.destroyApp(args.name).catch(e => {
      this.error(e)
    })

    cli.action.stop()
  }

  async destroyApp(name) {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    return axios.delete(`${endpoint}/v1/${team}/applications/${name}?api_token=${token}`)
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

AppsDestroyCommand.args = [
  {
    name: 'name',
    required: true,
  },
]

AppsDestroyCommand.description = 'permanently destroy an app'

module.exports = AppsDestroyCommand
