const {Command, flags} = require('../../base')

class AuthTokenCommand extends Command {
    async run() {
        if(this.config.userConfig.user) {
            this.log("Your API token:")
            this.log(this.config.userConfig.user.token)
        } else {
            this.log("Not logged in");
        }
    }

}

AuthTokenCommand.aliases = [
    'token'
]

AuthTokenCommand.description = 'display api token'

module.exports = AuthTokenCommand
