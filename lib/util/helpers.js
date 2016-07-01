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

var initSyncOptions = exports.initSyncOptions = {
    dir: path.dirname(require.main.filename) + "/../persist"
}

var log = exports.log = function(){
    var args = Array.prototype.slice.call(arguments)
    args.unshift(sig)
    args = args.filter(function(n){ return n != undefined });
    console.log.apply(console, args)
    return this
};

var warning = exports.warning = function(msg){
	console.log("\n    Warning".yellow, "-", msg)
    console.log()
};

var abort = exports.abort = function(msg){
  	msg === null
        ? console.log("\n    Aborted".red)
        : console.log("\n    Aborted".red, "-", msg)
    console.log()
    process.exit(1);
};

var parseArgs = exports.parseArgs = function(arg){
    if(arg.hasOwnProperty("parent") && arg.parent.hasOwnProperty("rawArgs")) {
        arg = arg.parent.rawArgs.slice(3)
    } else if(arg.argv && arg.argv._) {
        arg = arg.parsed.argv._.slice(1)
    }
    
    return arg instanceof Array ? minimist(arg) : arg
}

var fileExists = exports.fileExists = function(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

var getUserHome = exports.getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
