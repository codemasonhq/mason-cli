var read = require("read");
var minimist = require("minimist");
var helpers = require("./util/helpers");
var dispatcher = require("./util/dispatcher");

module.exports = function(config) {
    
    config = config || {}
    config.endpoint = config.endpoint ? config.endpoint : 'http://localhost:8080';
    config.registry = config.registry ? config.registry : 'registry.mason.ci';
    config.git = config.git ? config.git : 'git.mason.ci';
    config.remote = config.remote ? config.remote : 'codemason';
    config.environment = config.environment ? config.environment : 'development';
    
    var options = {}

    /**
     * Constructor
     */
    var mason = function(args){

        // Parse argument options 
        var argv = minimist(args, options)
        var cmd  = argv._[0] // pull out command from args

        // var commands = ["login", "logout", "whoami", "list", "craft", "deploy"]
        var commands = ["login", "whoami", "craft", "create", "deploy"];

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
                read: read,
            }, plugin); 
        
        }

    }
    
    return mason

}