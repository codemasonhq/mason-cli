const {Command} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const os = require('os')

class LogoutCommand extends Command {
  async run() {
    cli.action.start('Logging out of your Codemason account')

    await this.deleteKey().catch(e => {
      this.error(e)
    })

    await this.clearPersistedData()

    cli.action.stop()
  }

  /**
   * Delete the SSH key for this user
   */
  async deleteKey() {
    return this.codemason.delete('/git/keys', {
      params: {
        title: os.hostname(),
        key: helpers.getSSHKey(this.config.home + '/.ssh/id_rsa').toString(),
      },
    })
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }

  /**
   * Remove user specific config
   */
  async clearPersistedData() {
    delete this.config.userConfig.user
    delete this.config.userConfig.team
    await fs.outputJSON(path.join(this.config.configDir, 'config.json'), this.config.userConfig, {spaces: 2})
  }
}

LogoutCommand.aliases = [
  'logout',
]

LogoutCommand.description = 'logout of your Codemason account'

module.exports = LogoutCommand
