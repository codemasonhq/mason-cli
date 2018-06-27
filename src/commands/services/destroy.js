const {Command, flags} = require('../../base')
const {CLIError} = require('@oclif/errors')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class ServiceDestroyCommand extends Command {
  async run() {
    const {args} = this.parse(ServiceDestroyCommand)
    const {flags} = this.parse(ServiceDestroyCommand)

    var app = _.first(args.service)
    var name = _.last(args.service)

    this.endpoint = _.get(this.config, 'userConfig.endpoint')
    this.team = _.get(this.config, 'userConfig.team.slug')
    this.token = _.get(this.config, 'userConfig.user.token')
    this.environment = flags.environment

    cli.action.start(`Destroying ${chalk.red(name)} service in ${chalk.cyan(app)}`)
    await this.destroyService(app, name).catch(e => this.error(e))
    cli.action.stop()
  }

  async destroyService(app, name) {
    var service = await this.getService(app, name).catch(e => {
      this.error(e)
    })

    return axios.delete(`${this.endpoint}/v1/${this.team}/services/${service.id}?environment=${this.environment}&api_token=${this.token}`)
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
    return axios.get(`${this.endpoint}/v1/${this.team}/services/${app}/${name}?environment=${this.environment}&api_token=${this.token}`)
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
        throw new CLIError('Invalid format for service arg')
      }
      return parts
    }),
  },
]

ServiceDestroyCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment the app is located in',
    default: 'development',
  }),
}

ServiceDestroyCommand.description = 'permanently destroy an app'

module.exports = ServiceDestroyCommand
