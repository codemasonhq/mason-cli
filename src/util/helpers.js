var _ = require('lodash');
var fs = require("fs");
var path = require("path");
// var colors = require("colors")
// var read = require("read")
var Table = require('cli-table')
var child = require('child_process');
var storage = require('node-persist');

// var Analytics = require('analytics-node');

/**
 * Retrieve directory of this package
 */
var PACKAGE_DIR = exports.PACKAGE_DIR = path.join(path.dirname(require.main.filename), "/../");

/**
 * Retrieve the directory the command is being run from
 */
var CURRENT_WORKING_DIR = exports.CURRENT_WORKING_DIR = process.cwd();

/**
 * Set the analytics helper to track usage
 */
// var analytics = exports.analytics = new Analytics('VpPJIWHX39N6iqKEiFP68XkAMpmXbAYT', { flushAt: 1, flushAfter: 1 });

/**
 * Check to see if a file exists
 */
var fileExists = exports.fileExists = function(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

/**
 * Return the path to users home directory
 */
var getUserHome = exports.getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

/**
 * Get the project from the git remote
 */
var getProjectFromGitRemote = exports.getProjectFromGitRemote = function(git) {

    return child.execSync('git remote -v | grep ' + git, {stdio: 'pipe'})
                .toString()
                .split("\n")[0]
                .split("\t")[1]
                .split(" ")[0]
                .split(":")[1]
                .replace('.git', '');

}

/**
 * Get the SSH key 
 */
var getSSHKey = exports.getSSHKey = function(sshKeyPath) {
    if(this.fileExists(sshKeyPath + '.pub')) {
        return fs.readFileSync(sshKeyPath + '.pub', 'utf8');
    } else {
        return false;
    }
}

/** 
 * Generate a random UUID
 * https://gist.github.com/jed/982883
 */
var uuid = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

/**
 * Get the tracking userId
 */
var getTrackingUserId = exports.getTrackingUserId = function() {
    var user = storage.getItem('user');

    if(user && user.id) {
        return user.id;
    } else {
        var anonId = uuid();
        storage.setItem('anonymous-id', anonId);
        return anonId;
    }
}

/**
 * Parse the errors returned by the API into a standard format
 */
const parseApiError = exports.parseApiError = function(error) {
    return _.join(_.flatten(_.toArray(error)), "\n" + " ".repeat('Error:'.length));
}

/**
 * Return a borderless CLI table
 */
const borderlessTable = exports.borderlessTable = function(paddingLeft, paddingRight) {
    return new Table({
          chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
                 , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
                 , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
                 , 'right': '' , 'right-mid': '' , 'middle': ' ' },
          style: { 'padding-left': paddingLeft ? paddingLeft : 0, 'padding-right': paddingRight ? paddingRight : 0 }
        });
}


var logError = exports.logError = function(error) {
    
    var self = this;
    
    // Get debug info 
    var debug = error.debug;
    delete error.debug

    // Output errors
    _.each(error, function(error) {
        self.log("     ↪  " + error);
    });

    // Output debug info
    if(debug && _.get(storage.getItem('config'), 'debug') == "true") {
        this.log("");
        this.log("DEBUG > exception: " + debug.exception);
        this.log("DEBUG >      line: " + debug.line);
        this.log("DEBUG >      file: " + debug.file);
        this.log("DEBUG >     trace: ");
        _.each(debug.trace, function(trace) {
            console.log(trace);
        });
    }

}