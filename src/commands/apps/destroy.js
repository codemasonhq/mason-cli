const {Command, flags} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class AppsDestroyCommand extends Command {
  async run() {
    const {args} = this.parse(AppsDestroyCommand)
    const {flags} = this.parse(AppsDestroyCommand)

    cli.action.start(`Destroying ${chalk.cyan(args.name)} (including all services)`)

    await this.destroyApp(args.name, flags.environment).catch(e => {
      this.error(e)
    })

    cli.action.stop()
  }

  async destroyApp(name, environment) {
    var team = _.get(this.config, 'userConfig.team.slug')
    return this.codemason.delete(`/${team}/applications/${name}?environment=${environment}`)
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

AppsDestroyCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment of the app',
    default: 'development',
  }),
}

AppsDestroyCommand.description = 'permanently destroy an app'

module.exports = AppsDestroyCommand
