const {Command, flags} = require('../../base')
const {CLIError} = require('@oclif/errors')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const env = require('node-env-file')
const axios = require('axios')
const fs = require('fs-extra')
const _ = require('lodash')

class ServicesCreateCommand extends Command {
  async run() {
    const {args} = this.parse(ServicesCreateCommand)

    var app = _.first(args.service)
    var name = _.last(args.service)

    cli.action.start('Creating service on Codemason...')

    const service = await this.createService(app, name).catch(e => {
      this.error(e)
    })

    cli.action.stop()

    const table = helpers.borderlessTable(4)
    table.push(['NAME', 'IMAGE',  'COMMAND', 'PORTS'])

    table.push([
      name,
      _.get(service, 'masonJson.image'),
      _.get(service, 'masonJson.command', ''),
      _.get(service, 'masonJson.ports', []).join(', '),
    ])

    this.log()
    this.log(table.toString())
  }

  async createService(app, name) {
    const {flags} = this.parse(ServicesCreateCommand)

    var environment = {}
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    // Load the environment file
    if (flags['env-file'] && fs.existsSync(flags['env-file'])) {
      environment = env(flags['env-file'])
    }

    // Parse any provided environment variables
    _.each(_.get(flags, 'env', []), env => {
      // Parse provided env var (KEY=VALUE)
      env = env.match(/^([^=]+)\s*=\s*(.*)$/)

      // Get the key
      var envKey = env[1]

      // Remove ' and " characters if right side of `=` is quoted
      var envValue = env[2].match(/^(['"]?)([^\n]*)\1$/m)[2]

      // Set the value in the environment object
      environment[envKey] = envValue
    })

    const masonJson = {
      masonVersion: 'v1',
      type: 'service',
      name: name,
      image: _.get(flags, 'image',  _.get(this.config, 'userConfig.registry') + '/' + team + '/' + app),
      command: _.get(flags, 'command'),
      environment: environment,
      ports: _.get(flags, 'port'),
      volumes: _.get(flags, 'volume'),
      links: _.get(flags, 'link'),
    }

    // Create the service
    return axios.post(`${endpoint}/v1/${team}/services?application=${app}&environment=${flags.environment}&api_token=${token}`, masonJson)
    .then(response => {
      return _.merge(response.data, {masonJson: masonJson})
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }
}

ServicesCreateCommand.args = [
  {
    name: 'service',
    required: true,
    description: 'service to create formatted as `<app>/<service>`',
    parse: (input => { // validate service arg is formatted correctly
      var parts = input.split('/')
      if (parts.length !== 2) {
        throw new CLIError('Invalid format for service arg. Please format as `<app>/<service>`')
      }
      return parts
    }),
  },
]

ServicesCreateCommand.flags = {
  environment: flags.string({
    char: 'e',
    description: 'the environment to access',
    default: 'development',
  }),
  image: flags.string({
    char: 'i',
    description: 'image for service to run',
  }),
  command: flags.string({
    char: 'c',
    description: 'command for service to run',
  }),
  port: flags.string({
    char: 'p',
    description: 'ports to define on service',
    multiple: true,
  }),
  env: flags.string({
    description: 'env variable available to the service',
    multiple: true,
  }),
  volume: flags.string({
    char: 'v',
    description: 'volume to mount on service',
    multiple: true,
  }),
  link: flags.string({
    char: 'l',
    description: 'link to another service',
    multiple: true,
  }),
  'env-file': flags.string({
    description: 'path to env file to load',
  }),
}

ServicesCreateCommand.description = 'create a new service'

module.exports = ServicesCreateCommand
