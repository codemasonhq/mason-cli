const {Command, flags} = require('../../base')
const helpers = require('../../util/helpers')
const axios = require('axios')
const chalk = require('chalk')
const _ = require('lodash')

class ServicesIndexCommand extends Command {
  async run() {
    const {flags} = this.parse(ServicesIndexCommand)

    this.log('Your services (' + chalk.green(_.get(this.config, 'userConfig.team.slug')) + ')')
    this.log()

    const services = await this.getServices(flags.environment).catch(e => {
      this.error(e)
    })

    const table = helpers.borderlessTable(4)
    table.push(['NAME', 'IMAGE',  'COMMAND', 'PORTS'])

    _.each(services, function (service) {
      var ports = _.get(service, 'rancher.launchConfig.ports', [])
      if (_.isNull(ports)) {
        ports = []
      }

      var command = _.get(service, 'rancher.launchConfig.command', [])
      if (_.isNull(command)) {
        command = []
      }

      table.push([
        _.get(service, 'name'),
        _.get(service, 'rancher.launchConfig.imageUuid', '').replace('docker:', ''),
        command.join(' '),
        ports.join(', '),
      ])
    })

    this.log(table.toString())
  }

  async getServices(environment) {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    return axios.get(`${endpoint}/v1/${team}/services?environment=${environment}&api_token=${token}`)
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

ServicesIndexCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment of services to list',
    default: 'development',
  }),
}

ServicesIndexCommand.description = 'list your services'

module.exports = ServicesIndexCommand
