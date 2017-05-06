var read = require("read");
var minimist = require("minimist");
var storage = require("node-persist");
var helpers = require("./util/helpers");
var dispatcher = require("./util/dispatcher");

storage.initSync(helpers.initSyncOptions);

module.exports = function(config) {

    config = storage.getItem('config') || config || {}
    
    var options = {
        alias: {
            app: "application",
            a: "application",
            s: "service",
            p: "path",
        },
        default: {
            endpoint: config.endpoint ? config.endpoint : 'http://localhost',
            registry: config.registry ? config.registry : 'registry.mason.ci',
            git: config.git ? config.git : 'git.mason.ci',
            remote: config.remote ? config.remote : 'codemason',
            environment: config.environment ? config.environment : 'development',
        }
    }

    /**
     * Constructor
     */
    var mason = function(args){

        // Parse argument options 
        var argv = minimist(args, options)
        var cmd = argv._[0] // pull out command from args

        var commands = ["login", "logout", "whoami", "token", "config", "self-update", "craft", "create", "deploy", "upgrade"];

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