const {Command, flags} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const env = require('node-env-file')
const axios = require('axios')
const chalk = require('chalk')
const YAML = require('yamljs')
const fs = require('fs-extra')
const _ = require('lodash')

class AppsDeployCommand extends Command {
  async run() {
    const {args} = this.parse(AppsDeployCommand)
    const {flags} = this.parse(AppsDeployCommand)

    cli.action.start('Deploying app to Codemason')

    // Parse deploy config
    let masonJson = {}
    if (flags['mason-json']) {
      masonJson = await this.parseMasonJson(args.name, flags['mason-json'])
    } else {
      masonJson = await this.parseComposeFile(args.name, _.get(flags, 'compose-file', 'docker-compose.yml'))
    }

    // Deploy
    const services = await this.deploy(args.name, flags.environment, masonJson).catch(e => {
      this.error(e)
    })

    cli.action.stop()

    this.log()
    this.log(chalk.cyan(` ⬢ ${args.name}`) + chalk.grey(` | ${_.get(this.config, 'userConfig.endpoint')}/applications/${args.name}`))
    this.log()

    const table = helpers.borderlessTable(4)
    table.push(['NAME', 'IMAGE',  'COMMAND', 'PORTS'])

    _.each(services, function (service) {
      table.push([
        _.get(service, 'name'),
        _.get(service, 'image'),
        _.get(service, 'command', ''),
        _.get(service, 'ports', []).join(', '),
      ])
    })

    this.log(table.toString())
  }

  /**
   * Parse the provided Mason JSON file
   */
  async parseMasonJson(name, file) {
    return fs.readJSON(file)
  }

  /**
   * Parse the provided compose file
   */
  async parseComposeFile(name, file) {
    const {flags} = this.parse(AppsDeployCommand)

    // Load the docker-compose.yml file
    var dockerCompose = YAML.load(file)

    // Populate Mason JSON
    return _.map(_.get(dockerCompose, 'services', []), (service, name) => {
      // Format environment variables provided in string form
      if (_.isArray(service.environment)) {
        var formatedEnvironment = {}

        // Convert environment variable array into key/value object
        _.forEach(service.environment, function (value) {
          formatedEnvironment[value.split('=')[0]] = value.split('=')[1]
        })

        // Override existing environment array with the key/value object
        service.environment = formatedEnvironment
      }

      // Replace build parameter with Docker image
      if (_.has(service, 'build')) {
        // Remove build, use image
        delete service.build
        delete service.volumes

        // Fetch the git remote
        let project = ''
        try {
          project = helpers.getProjectFromGitRemote(_.get(this.config, 'userConfig.git'))
        } catch (e) {
          this.error('Could not read git remote')
        }

        // Set image as repo's image
        service.image = _.get(this.config, 'userConfig.registry') + '/' + project.toLowerCase()

        // Load environment file, if available
        if (!flags['no-env-file'] && fs.existsSync(flags['env-file'])) {
          service.environment = _.merge(service.environment, env(flags['env-file']))
        }
      }

      // Parse linked services
      if (_.has(service, 'links')) {
        this.warn('Stripped `links` parameter. You may add links manually via the UI.')
        delete service.links
      }

      service.name = name
      service.type = 'service'
      service.masonVersion = 'v1'
      service.volumes = _.map(service.volumes, function (volume) {
        return (volume[0] === '.') ? volume.substr(1) : volume
      })

      return service
    })
  }

  async deploy(name, environment, masonJson) {
    var endpoint = _.get(this.config, 'userConfig.endpoint')
    var team = _.get(this.config, 'userConfig.team.slug')
    var token = _.get(this.config, 'userConfig.user.token')

    const requests = _.map(masonJson, service => {
      return axios.post(`${endpoint}/v1/${team}/services?application=${name}&environment=${environment}&api_token=${token}`, _.merge({
        masonVersion: 'v1',
        type: 'service',
      }, service))
      .then(response => {
        return _.merge(service, response.data)
      })
    })

    return Promise.all(requests).catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }
}

AppsDeployCommand.args = [
  {
    name: 'name',
    required: true,
  },
]

AppsDeployCommand.flags = {
  'compose-file': flags.string({
    char: 'c',
    // default: 'docker-compose.yml',
    description: '[default: docker-compose.yml] path to a docker compose file',
    exclusive: ['mason-json'],
  }),
  'mason-json': flags.string({
    char: 'm',
    description: 'path to a mason json file',
    exclusive: ['compose-file'],
  }),
  'env-file': flags.string({
    default: '.env',
    description: 'path to env file to load',
    exclusive: ['mason-json'],
  }),
  'no-env-file': flags.boolean({
    exclusive: ['mason-json'],
  }),
  environment: flags.string({
    char: 'e',
    description: 'the environment to deploy the app to',
    default: 'development',
  }),
}

AppsDeployCommand.description = 'create a new app'

module.exports = AppsDeployCommand
