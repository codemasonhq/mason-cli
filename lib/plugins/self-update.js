var storage = require('node-persist');
var helpers = require("../util/helpers");
var selfupdate = require('selfupdate');
var packageJSON = require('../../package.json');

/**
 * Automatically update the Mason CLI to get fixes and features	
 */
var selfUpdate = function(req, next, abort) {


    selfUpdate.isLatest()
                .then(function(isLatest) {

                    if(isLatest) {
                        helpers.log();
                        // helpers.log("   ✔ Looks like you're already up to date!".green);
                        helpers.log("   ⬩ You are running the latest version ".green);
                        helpers.log("     ↪ Running: " + packageJSON.version.white);
                        helpers.log()
                    } else {
                        selfUpdate.runUpdate();
                    }

                });
}

/**
 * Check if user is running the latest version 
 */
selfUpdate.isLatest = function() {
    return new Promise(function(resolve, reject) {
        selfupdate.isUpdated(packageJSON, function(error, isUpdated) {
            if(error) helpers.abort(error);
            resolve(isUpdated);
        });
    });
}

/**
 * Update the CLI
 */
selfUpdate.runUpdate = function() {
    selfupdate.update(packageJSON, function(error, version) {
        if(error) helpers.abort(error);
        helpers.log();
        helpers.log("   ✔ Successfully updated".green);
        helpers.log("     ↪ Running: " + version.white);
        helpers.log();
    });
}

module.exports = selfUpdate;
