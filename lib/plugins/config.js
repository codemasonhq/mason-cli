var _ = require("lodash");
var storage = require('node-persist');
var helpers = require("../util/helpers");

storage.initSync(helpers.initSyncOptions);

/**
 * Manage persistent config values 
 */
var config = function(req, next, abort) {

    config.config = req.argv;

    // Handle config command
    switch(req.argv._[0]) {
        case "list":
            helpers.log(config.list());
        break;
        
        case "get":
            helpers.log(config.get(req.argv._[1]));
        break;

        case "set":
            config.set(req.argv._[1], req.argv._[2]);
        break;

        case "delete":
            config.delete(req.argv._[1]);
        break;
    }

}

/**
 * List the config values
 */
config.list = function() {
    return _.omit(config.config, '_');
}

/**
 * Get the config value 
 */
config.get = function(key) {
    return _.get(config.config, key)
}

/**
 * Store the config value
 */
config.set = function(key, value) {

    // Fetch the existing config
    var config = storage.getItem('config');

    // Add the new value
    config[key] = value;

    // Update stored config
    storage.setItem('config', config);

}

/**
 * Delete a config value
 */
config.delete = function(key) {

    // Fetch the existing config
    var config = storage.getItem('config');

    // Delete the value
    delete config[key]

    // Update stored config
    storage.setItem('config', config);
}

module.exports = config;
