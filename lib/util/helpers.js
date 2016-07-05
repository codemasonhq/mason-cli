var fs = require("fs");
var path = require("path");
var colors = require("colors")
var read = require("read")

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
 * Parse the args received by the script
 */ 
var parseArgs = exports.parseArgs = function(arg){
    if(arg.hasOwnProperty("parent") && arg.parent.hasOwnProperty("rawArgs")) {
        arg = arg.parent.rawArgs.slice(3)
    } else if(arg.argv && arg.argv._) {
        arg = arg.parsed.argv._.slice(1)
    }
    
    return arg instanceof Array ? minimist(arg) : arg
}

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
