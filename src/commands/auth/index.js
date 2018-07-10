const {Command, flags} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const child = require('child_process')
const axios = require('axios')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const os = require('os')

class LoginCommand extends Command {
  async run() {
    const {flags} = this.parse(LoginCommand)

    this.log('Login to your Codemason account')

    const email = flags.email || await cli.prompt('Email', {default: _.get(this.config, 'userConfig.user.email')})
    const password = flags.password || await cli.prompt('Password', {type: 'hide'})

    await this.authenticate(email, password).catch(e => {
      this.error(e)
    })

    await this.uploadKey().catch(e => {
      this.error(e)
    })

    this.log('Logged in as ' + chalk.green(_.get(this.config, 'userConfig.user.email')))
  }

  /**
   * Authenticate the user and store get a JWT token
   */
  async authenticate(email, password) {
    return axios.post(`${_.get(this.config, 'userConfig.endpoint')}/v1/token`, {
      email: email,
      password: password,
      token_name: 'Mason CLI - ' + os.hostname().split('.').shift(), // eslint-disable-line camelcase
    })
    .then(async response => {
      this.config.userConfig.user = _.get(response, 'data.user', {})
      _.merge(this.config.userConfig.user, _.pick(_.get(response, 'data', {}), 'token'))
      this.config.userConfig.team = _.pick(_.get(response, 'data.team', {}), ['slug', 'current_billing_plan'])
      await fs.outputJSON(path.join(this.config.configDir, 'config.json'), this.config.userConfig, {spaces: 2})
      return _.get(response, 'data.token')
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }

  /**
   * Upload their public SSH key to Codemason
   * so user's machine is recognised by git
   */
  async uploadKey() {
    let key = helpers.getSSHKey(this.config.home + '/.ssh/id_rsa')

    if (key === false) {
      this.warn('Could not find an existing public key')
      this.log('Generating new SSH public key')
      key = this.generateKey()
    }

    return axios.post(`${_.get(this.config, 'userConfig.endpoint')}/v1/git/keys`, {
      api_token: _.get(this.config, 'userConfig.user.token'), // eslint-disable-line camelcase
      title: os.hostname(),
      key: key,
    })
    .then(response => {
      return _.get(response, 'data.token')
    })
    .catch(error => {
      // Don't alert the user if the key has already been added
      if (_.flatten(_.toArray(_.get(error, 'response.data'))).indexOf('"fingerprint" has already been taken') !== -1) {
        return
      }

      // Report API errors
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }

  /**
   * Generate a new key with ssh-keygen
   */
  generateKey() {
    child.execSync('ssh-keygen -t rsa -f ' + this.config.home + "/.ssh/id_rsa -q -N ''")
    return helpers.getSSHKey(this.config.home + '/.ssh/id_rsa')
  }
}

LoginCommand.aliases = [
  'login',
]

LoginCommand.flags = {
  email: flags.string({char: 'e', description: 'email'}),
  password: flags.string({char: 'p', description: 'password'}),
}

LoginCommand.description = 'login to your Codemason account'

module.exports = LoginCommand
