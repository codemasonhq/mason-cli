const {Command, flags} = require('../../base')
const {CLIError} = require('@oclif/errors')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const env = require('node-env-file')
const fs = require('fs-extra')
const axios = require('axios')
const _ = require('lodash')

class ServicesUpgradeCommand extends Command {
  async run() {
    const {args} = this.parse(ServicesUpgradeCommand)
    const {flags} = this.parse(ServicesUpgradeCommand)

    var app = _.first(args.service)
    var name = _.last(args.service)

    this.endpoint = _.get(this.config, 'userConfig.endpoint')
    this.team = _.get(this.config, 'userConfig.team.slug')
    this.token = _.get(this.config, 'userConfig.user.token')
    this.environment = flags.environment

    if (flags.finish) {
      cli.action.start('Finishing upgrade of service on Codemason...')
      await this.finishUpgrade(app, name).catch(e => this.error(e))
      cli.action.stop()
      return
    }

    if (flags.cancel) {
      cli.action.start('Cancelling upgrade of service on Codemason...')
      await this.cancelUpgrade(app, name).catch(e => this.error(e))
      cli.action.stop()
      return
    }

    if (flags.rollback) {
      cli.action.start('Rolling back upgrade of service on Codemason...')
      await this.rollbackUpgrade(app, name).catch(e => this.error(e))
      cli.action.stop()
      return
    }

    if (flags['cancel-rollback']) {
      cli.action.start('Cancelling rollback of service on Codemason...')
      await this.cancelRollback(app, name).catch(e => this.error(e))
      cli.action.stop()
      return
    }

    cli.action.start('Upgrading service on Codemason...')
    await this.upgradeService(app, name).catch(e => this.error(e))
    cli.action.stop()
  }

  async upgradeService(app, name) {
    const {flags} = this.parse(ServicesUpgradeCommand)

    var service = await this.getService(app, name).catch(e => {
      this.error(e)
    })

    // An image is requried. By default use the same image as previously used
    let image =  _.get(service, 'rancher.launchConfig.imageUuid', '').replace('docker:', '')
    if (flags.image) {
      image = flags.image
    }

    // Load the environment file
    let environment = {}
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
      image: image,
      command: _.get(flags, 'command'),
      environment: environment,
      ports: _.get(flags, 'port'),
      volumes: _.get(flags, 'volume'),
      links: _.get(flags, 'link'),
      labels: {
        'io.rancher.container.pull_image': 'always',
      },
    }

    // Upgrade the service
    return axios.put(`${this.endpoint}/v1/${this.team}/services/${service.id}?environment=${this.environment}&api_token=${this.token}`, masonJson)
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

  async finishUpgrade(app, name) {
    return this._baseUpgradeRequest('upgrade/finish', app, name)
  }

  async cancelUpgrade(app, name) {
    return this._baseUpgradeRequest('upgrade/cancel', app, name)
  }

  async rollbackUpgrade(app, name) {
    return this._baseUpgradeRequest('rollback', app, name)
  }

  async cancelRollback(app, name) {
    return this._baseUpgradeRequest('rollback/cancel', app, name)
  }

  async getService(app, name) {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    return axios.get(`${endpoint}/v1/${team}/services/${app}/${name}?api_token=${token}`)
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

  async _baseUpgradeRequest(route, app, name) {
    var service = await this.getService(app, name).catch(e => {
      this.error(e)
    })

    return axios.post(`${this.endpoint}/v1/${this.team}/services/${service.id}/${route}?environment=${this.environment}&api_token=${this.token}`)
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

ServicesUpgradeCommand.args = [
  {
    name: 'service',
    required: true,
    description: 'service to create formatted as `<app>/<service>`',
    parse: (input => { // validate service arg is formatted correctly
      var parts = input.split('/')
      if (parts.length !== 2) {
        throw new CLIError('Invalid format for service arg')
      }
      return parts
    }),
  },
]

ServicesUpgradeCommand.flags = {
  finish: flags.boolean({
    description: 'finish an upgrade',
    exclusive: ['cancel', 'rollback', 'cancel-rollback'],
  }),
  cancel: flags.boolean({
    description: 'cancel an upgrade',
    exclusive: ['finish', 'rollback', 'cancel-rollback'],
  }),
  rollback: flags.boolean({
    description: 'rollback an upgrade',
    exclusive: ['finish', 'cancel', 'cancel-rollback'],
  }),
  'cancel-rollback': flags.boolean({
    description: 'cancel a rollback',
    exclusive: ['finish', 'cancel', 'rollback'],
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
  environment: flags.string({
    char: 'e',
    description: 'the environment the service is located in',
    default: 'development',
  }),
}

ServicesUpgradeCommand.description = 'upgrade a service'

module.exports = ServicesUpgradeCommand
