var minimist    = require('minimist');
var helpers     = require("./util/helpers");
var dispatcher  = require('./util/dispatcher');

module.exports = function(config) {
    
    var options = {}

    config = config || {}

    /**
     * Constructor
     */
    var mason = function(args){

        // Parse argument options 
        var argv = minimist(args, options)
        var cmd  = argv._[0] // pull out command from args

        // var commands = ["login", "logout", "whoami", "list", "craft", "deploy"]
        var commands = ["craft", "deploy"];

        if (commands.indexOf(cmd) !== -1) {
            argv._.shift()
            mason.run()(cmd, argv);
        } else {
            helpers.abort("Command \""+ cmd.white + "\" is not defined or has not been installed");
        }
    
    }

    /**
     * Load plugin
     */
     mason.load = function(plugin) {
        try {
            return require("./plugins/"+plugin);
        } catch(e) {

            if (e.code !== 'MODULE_NOT_FOUND') {
                helpers.warning("Could not load or access the "+ plugin.white + " plugin.");
                helpers.warning(e);
                return null;
            } else {
                throw e;
            }
        }
    }

    /**
     * Standard mechanism for running a plugin command.
     */
    mason.run = function() {

        return function(cmd) {

            var plugin = mason.load(cmd);
            var argv = helpers.parseArgs(arguments[arguments.length -1])

            dispatcher({
                config: config,
                argv: argv,
            }, plugin); 
        
        }

    }
    
    return mason

}