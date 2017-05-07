var _ = require("lodash");
var config = require('./config');
var storage = require('node-persist');
var helpers = require("../util/helpers");

/**
 * Manage persistent config values 
 */
var team = function(req, next, abort) {

    config.config = req.argv;

    // Handle config command
    switch(req.argv._[0]) {
        default:
        case "switch":
            team.set(req.argv._[0] || req.argv._[1]);
        break;

        case "current":
            helpers.log(team.current());
        break;
    }

}

/**
 * Get the current team
 */
team.current = function() {
    return config.get('team')
}

/**
 * Set the current team
 */
team.set = function(team) {
    config.set('team', team);
}

module.exports = team;
