const {Command} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
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
    var team = _.get(this.config, 'userConfig.team.slug')
    return this.codemason.delete(`/${team}/apps/${name}`)
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
