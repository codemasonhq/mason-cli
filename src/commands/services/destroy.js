const {Command} = require('../../base')
const {CLIError} = require('@oclif/errors')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const chalk = require('chalk')
const _ = require('lodash')

class ServiceDestroyCommand extends Command {
  async run() {
    const {args} = this.parse(ServiceDestroyCommand)

    var app = _.first(args.service)
    var name = _.last(args.service)

    this.team = _.get(this.config, 'userConfig.team.slug')

    cli.action.start(`Destroying ${chalk.red(name)} service in ${chalk.cyan(app)}`)
    await this.destroyService(app, name).catch(e => this.error(e))
    cli.action.stop()
  }

  async destroyService(app, name) {
    var service = await this.getService(app, name).catch(e => {
      this.error(e)
    })

    return this.codemason.delete(`/${this.team}/apps/${app}/services/${service.id}`)
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

  async getService(app, name) {
    return this.codemason.get(`/${this.team}/apps/${app}/services/${name}`)
    .then(response => {
      return response.data
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }
}

ServiceDestroyCommand.args = [
  {
    name: 'service',
    required: true,
    description: 'service to destroy formatted as `<app>/<service>`',
    parse: (input => { // validate service arg is formatted correctly
      var parts = input.split('/')
      if (parts.length !== 2) {
        throw new CLIError('Invalid format for service arg, requires `<app>/<service>` format')
      }
      return parts
    }),
  },
]

ServiceDestroyCommand.description = 'permanently destroy an app'

module.exports = ServiceDestroyCommand
