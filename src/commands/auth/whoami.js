const {Command} = require('../../base')

class AuthWhoamiCommand extends Command {
  async run() {
    if (this.config.userConfig.user) {
      this.log('You are currently logged in.')
      this.log(`Name: ${this.config.userConfig.user.name}`)
      this.log(`Email: ${this.config.userConfig.user.email}`)
    } else {
      this.log('Not logged in')
    }
  }
}

AuthWhoamiCommand.aliases = [
  'whoami',
]

AuthWhoamiCommand.description = 'display user info'

module.exports = AuthWhoamiCommand
