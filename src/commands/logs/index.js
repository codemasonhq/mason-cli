const {Command, flags} = require('../../base')
const {cli} = require('cli-ux')

const helpers = require('../../util/helpers')
const WebSocket = require('ws')
const moment = require('moment')
const chalk = require('chalk')
const axios = require('axios')
const _ = require('lodash')

class LogsIndexCommand extends Command {
  async run() {
    const {args} = this.parse(LogsIndexCommand)
    const {flags} = this.parse(LogsIndexCommand)

    cli.action.start('Connecting to log stream')

    this.colors = ['red', 'green',  'yellow', 'blue', 'magenta', 'cyan']
    this.logTrace = []
    this.logServiceColors = {}
    this.loggingToConsole = false

    this.application = await this.getApp(args.app, flags.environment).catch(e => {
      this.error(e)
    })

    // Extract container IDs to connect to log stream
    const services = _.get(this.application, 'services')
    const containerIds =  _.compact(_.flatten(_.map(services, service => {
      return _.get(service, 'rancher.instanceIds')
    })))

    // Prepare array of log stream requests
    const streamRequests = _.map(containerIds, id => {
      return this.logStreamRequest(id)
    })

    // Request log stream websockets for each container
    this.streamAllLogs(streamRequests)
  }

  /**
   * Fetch Codemason app
   */
  async getApp(application, environment) {
    var team = _.get(this.config, 'userConfig.team.slug')
    return this.codemason.get(`/${team}/applications/${application}?environment=${environment}`)
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

  /**
   * Request log stream websocket details for each container
   */
  streamAllLogs(requests) {
    axios.all(requests)
    .then(responses => {
      _.each(responses, response => {
        if (response.status === 200) {
          this.streamLogs(
            _.get(response, 'config.url').split('/')[6],
            _.get(response, 'data.url'),
            _.get(response, 'data.token')
          )
        } else {
          // Retry connection
          // this.streamAllLogs([
          // this.logStreamRequest(_.get(response, 'config.url').split("/")[4])
          // ])
        }
      })
    })
  }

  /**
   * Return an Codemason API request to access the container logs
   */
  logStreamRequest(id) {
    var team = _.get(this.config, 'userConfig.team.slug')
    return this.codemason.get(`${team}/containers/${id}/logs`)
    .catch(error => {
      return error
    })
  }

  /**
   * Connect to the container log stream websocket returned by the request.
   * Catches the burst of logs upon connection, sorts them then logs them.
   */
  streamLogs(id, url, token) {
    const {flags} = this.parse(LogsIndexCommand)

    const service = _.find(this.application.services, function (service) {
      return _.includes(service.rancher.instanceIds, id)
    })

    const container = _.find(service.rancher.instances, {id: id})

    // Choose a color for logs from this service
    if (!_.has(this.logServiceColors[service.name])) {
      const colorPos = Math.floor(Math.random() * this.colors.length)
      this.logServiceColors[service.name] = this.colors[colorPos]
      this.colors.splice(colorPos, 1)
    }

    cli.action.start('Preparing log sockets')

    const socket = new WebSocket(url + '?token=' + token)

    // Sort the log trace (sent as a "burst" upon connection) by time before logging to console
    socket.on('open', () => {
      this.logginToConsole = false

      setTimeout(() => {
        cli.action.stop()
        this.loggingToConsole = true

        const orderedLogs = _.sortBy(this.logTrace, l => l.timestamp)
        _.each(orderedLogs, l => {
          process.stdout.write(chalk[l.color](`${l.timestamp} ${l.service}[${l.containerName}]`) + ': ' + l.message)
        })

        // Close connection not tailing
        if (!flags.tail) {
          socket.terminate()
        }

        this.logTrace = []
      }, 2000)
    })

    //
    socket.on('message', event => {
      const color = _.get(this.logServiceColors, service.name) || 'magenta'
      const timestamp = moment(_.first(event.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d*Z/i))).utc().format('YYYY-MM-DD[T]HH:mm:ss.SSSZ')
      const message = event.replace(/(\d{2}) (\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d*Z /i, '')

      // When `loggingToConsole` immediately log, otherwise add to logTrace for sorting
      if (this.loggingToConsole) {
        process.stdout.write(chalk[color](`${timestamp} ${service.name}[${container.name}]`) + ': ' + message)
      } else {
        this.logTrace.push({
          service: service.name,
          containerName: container.name,
          container: id,
          color: color,
          timestamp: timestamp,
          message: message,
        })
      }
    })
  }
}

LogsIndexCommand.args = [
  {
    name: 'app',
    required: true,
    description: 'app to run command against',
  },
]

LogsIndexCommand.flags = {
  service: flags.string({
    name: 'service',
    required: false,
    description: 'only show output from this service',
  }),
  tail: flags.boolean({
    name: 'tail',
    char: 't',
    required: false,
    description: 'continually stream logs',
  }),
  environment: flags.string({
    char: 'e',
    description: 'the environment of apps to list',
    default: 'development',
  }),
}

LogsIndexCommand.description = 'display recent log output'

module.exports = LogsIndexCommand
