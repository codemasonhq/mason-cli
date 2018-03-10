var fs = require("fs");
var path = require("path");
var colors = require("colors")
var read = require("read")
var child = require('child_process');
var storage = require('node-persist');
var Analytics = require('analytics-node');

var sig = null;

/**
 * This looks like nothing but there is an invisible seperator character here 
 * It's used to beat `read`'s .trim() method they apply to the prompts.
 * http://www.fileformat.info/info/unicode/char/2063/index.htm
 */
var INVISIBLE_CHARACTER = exports.INVISIBLE_CHARACTER = "⁣";

/**
 * Retrieve directory of this package
 */
var PACKAGE_DIR = exports.PACKAGE_DIR = path.join(path.dirname(require.main.filename), "/../");

/**
 * Retrieve the directory the command is being run from
 */
var CURRENT_WORKING_DIR = exports.CURRENT_WORKING_DIR = process.cwd();

/**
 * Current version of the Mason CLI
 */
var CLI_VERSION = exports.CLI_VERSION = require('../../package.json').version;

/**
 * Options for the spinner
 */
var SPINNER = exports.SPINNER = {
    "interval": 80,
    "frames": [
        "      ⠋ ",
        "      ⠙ ",
        "      ⠹ ",
        "      ⠸ ",
        "      ⠼ ",
        "      ⠴ ",
        "      ⠦ ",
        "      ⠧ ",
        "      ⠇ ",
        "      ⠏ "
    ]
}

/**
 * Set the analytics helper to track usage
 */
var analytics = exports.analytics = new Analytics('VpPJIWHX39N6iqKEiFP68XkAMpmXbAYT', { flushAt: 1, flushAfter: 1 });

/**
 * Set the options for our pesistance storage
 */
var initSyncOptions = exports.initSyncOptions = {
    dir: path.dirname(require.main.filename) + "/../persist"
}

/**
 * Log message to the console
 */
var log = exports.log = function(){
    var args = Array.prototype.slice.call(arguments)
    args.unshift(sig)
    args = args.filter(function(n){ return n != undefined });
    console.log.apply(console, args)
    return this
};

/**
 * Log warning to the console
 */
var warning = exports.warning = function(msg){
    console.log("\n    Warning".yellow, "-", msg)
    console.log()
};

/**
 * Log abort message then abort script
 */
var abort = exports.abort = function(msg){
      msg === null
        ? console.log("\n    Aborted".red)
        : console.log("\n    Aborted".red, "-", msg)
    console.log()
    process.exit(1);
};

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
 * Successful request check
 */
var isSuccessful = exports.isSuccessful = function(status) {
    return status < 400;
}
