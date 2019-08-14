const {Command} = require('../../base')
const {CLIError} = require('@oclif/errors')

const helpers = require('../../util/helpers')
const _ = require('lodash')

class ServicesOpenCommand extends Command {
  async run() {
    const {args} = this.parse(ServicesOpenCommand)
    var team = _.get(this.config, 'userConfig.team.slug')
    var app = _.first(args.service)
    var name = _.last(args.service)
    helpers.openUrl(`http://${name}.${app}.${team}.c-m.io`)
  }
}

ServicesOpenCommand.aliases = [
  'open',
]

ServicesOpenCommand.args = [
  {
    name: 'service',
    required: true,
    description: 'service to open formatted as `<app>/<service>`',
    parse: (input => { // validate service arg is formatted correctly
      var parts = input.split('/')
      if (parts.length !== 2) {
        throw new CLIError('Invalid format for service arg, requires `<app>/<service>` format')
      }
      return parts
    }),
  },
]

ServicesOpenCommand.description = 'open the service in a web browser'

module.exports = ServicesOpenCommand
