const {Command, flags} = require('../../base')
const {CLIError} = require('@oclif/errors')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const readline = require('readline')
const WebSocket = require('ws')
const chalk = require('chalk')
const _ = require('lodash')

class RunIndexCommand extends Command {
  async run() {
    const {args} = this.parse(RunIndexCommand)
    const {flags} = this.parse(RunIndexCommand)

    this.team = _.get(this.config, 'userConfig.team.slug')

    cli.action.start(`Running ${chalk.yellow(args.command)} on ${chalk.cyan('⬢ ' + flags.service.join('/'))}`)

    const service = await this.getService(...flags.service).catch(e => {
      this.error(e)
    })

    var activeContainers = _.filter(_.get(service, 'rancher.instances'), service => service.state === 'running')
    if (activeContainers.length === 0) {
      this.error('No active containers available to run one-off command')
    }

    var response = await this.containerExec(_.first(activeContainers), args.command)
    var socket = this.getSocketConnection(response.url, response.token)

    cli.action.stop()

    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    readline.emitKeypressEvents(process.stdin)

    let sigints = []

    process.stdin.on('keypress', (str, key) => {
      socket.send(Buffer.from(key.sequence).toString('base64'))

      // Exit
      if (str === '\u0003') {
        sigints.push(new Date())
      }

      // SIGINTs in the last second
      sigints = sigints.filter(d => d > new Date() - 1000)

      // Force disconnect on repeated SIGINTs
      if (sigints.length >= 4) {
        /* eslint-disable  no-process-exit */
        /* eslint-disable unicorn/no-process-exit */
        this.log('Disconnecting... Goodbye!')
        process.exit()
      }
    })

    socket.on('message', data => {
      process.stdout.write(Buffer.from(data, 'base64').toString('ascii'))
    })
  }

  async getService(app, name) {
    return this.codemason.get(`/${this.team}/apps/${app}/services/${name}`)
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

  async containerExec(container, command) {
    return this.codemason.post(`/${this.team}/containers/${container.id}/execute`, {
      command: [
        '/bin/sh', '-c', `TERM=xterm-256color; export TERM; [ -x /bin/bash ] && ([ -x /usr/bin/script ] && /usr/bin/script -q -c "/bin/bash" /dev/null || exec ${command}) || exec ${command}`,
      ],
    })
    .then(response => response.data)
    .catch(error => {
      if (_.has(error, 'response.data')) {
        throw helpers.parseApiError(error.response.data)
      }

      throw error.toString().replace('Error: ', '')
    })
  }

  getSocketConnection(url, token) {
    return new WebSocket(url + '?token=' + token)
  }
}

RunIndexCommand.aliases = [
  'run',
]

RunIndexCommand.args = [
  {
    name: 'command',
    required: false,
    default: 'sh',
  },
]

RunIndexCommand.flags = {
  service: flags.string({
    name: 'service',
    required: true,
    description: 'service to run one-off command, formatted as `<app>/<service>`',
    parse: (input => { // validate service arg is formatted correctly
      var parts = input.split('/')
      if (parts.length !== 2) {
        throw new CLIError('Invalid format for service arg, requires `<app>/<service>` format')
      }
      return parts
    }),
  }),
}

RunIndexCommand.description = 'run a one-off process inside service'

module.exports = RunIndexCommand
