var colors      = require('colors')
var read        = require("read")

var sig = null;

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