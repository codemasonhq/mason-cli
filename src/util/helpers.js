var _ = require('lodash')
var fs = require('fs')
var Table = require('cli-table')
var child = require('child_process')
var storage = require('node-persist')

// var Analytics = require('analytics-node');

/**
 * Set the analytics helper to track usage
 */
// var analytics = exports.analytics = new Analytics('VpPJIWHX39N6iqKEiFP68XkAMpmXbAYT', { flushAt: 1, flushAfter: 1 });

/**
 * Check to see if a file exists
 */
exports.fileExists = function (filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (err) {
    return false
  }
}

/**
 * Get the project from the git remote
 */
exports.getProjectFromGitRemote = function (git) {
  return child.execSync('git remote -v | grep ' + git, {stdio: 'pipe'})
  .toString()
  .split('\n')[0]
  .split('\t')[1]
  .split(' ')[0]
  .split(':')[1]
  .replace('.git', '')
}

/**
 * Get the SSH key
 */
exports.getSSHKey = function (sshKeyPath) {
  if (this.fileExists(sshKeyPath + '.pub')) {
    return fs.readFileSync(sshKeyPath + '.pub', 'utf8')
  }
  return false
}

/**
 * Generate a random UUID
 * https://gist.github.com/jed/982883
 */
// var uuid = function (a) {
//   return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b)
// }

/**
 * Get the tracking userId
 */
// var getTrackingUserId = exports.getTrackingUserId = function () {
//   var user = storage.getItem('user')

//   if (user && user.id) {
//     return user.id
//   }
//   var anonId = uuid()
//   storage.setItem('anonymous-id', anonId)
//   return anonId
// }

/**
 * Add a git remote
 */
exports.createGitRemote = function (git, team, name, remote) {
  child.execSync(`git remote add ${remote} git@${git}:${team}/${name.toLowerCase()}`, {stdio: 'pipe'})
}

/**
 * Parse the errors returned by the API into a standard format
 */
exports.parseApiError = function (error) {
  return _.join(_.flatten(_.toArray(error)), '\n' + ' '.repeat('Error:'.length))
}

/**
 * Return a borderless CLI table
 */
exports.borderlessTable = function (paddingLeft, paddingRight) {
  return new Table({
    chars: {top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
      bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      left: '', 'left-mid': '', mid: '', 'mid-mid': '',
      right: '', 'right-mid': '', middle: ' '},
    style: {'padding-left': paddingLeft ? paddingLeft : 0, 'padding-right': paddingRight ? paddingRight : 0},
  })
}

exports.logError = function (error) {
  var self = this

  // Get debug info
  var debug = error.debug
  delete error.debug

  // Output errors
  _.each(error, function (error) {
    self.log('     ↪  ' + error)
  })

  // Output debug info
  if (debug && _.get(storage.getItem('config'), 'debug') === 'true') {
    this.log('')
    this.log('DEBUG > exception: ' + debug.exception)
    this.log('DEBUG >      line: ' + debug.line)
    this.log('DEBUG >      file: ' + debug.file)
    this.log('DEBUG >     trace: ')
    _.each(debug.trace, function (trace) {
      this.log(trace)
    })
  }
}
