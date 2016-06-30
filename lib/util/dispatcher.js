var helpers = require("./helpers");

/**
 * Every CLI command is a "plugin". 
 * This function dispatches all of the requests
 * to the various plugins and passes context to it.
 * --
 * It contains information about arguments as well as information
 * like auth token and app name which gets passed on to the plugin
 */

module.exports = function(req, plugin, abort){

    var that = this;

    /**
     * Render any aborts to the console
     */
    abort = abort || function(msg) {
        helpers.abort(msg);
    }

    /**
     * Call the plugin 
     */
    function next(err) {
        if(!plugin) return;
        plugin.call(that, req, next, abort);
    }

    // Return the plugin call as callback
    return next();

}