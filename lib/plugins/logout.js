var fs = require("fs");
var path = require("path");
var request = require("request");
var child = require('child_process');
var storage = require('node-persist');
var helpers = require("../util/helpers");
var os = require("os");
var hostname = os.hostname();

storage.initSync(helpers.initSyncOptions);

/**
 * Config passed to plugin through dispatcher 
 */
var config;

/** 
 * Retrieve token from persistent storage
 */
var token = storage.getItem('token');

/**
 * Path to users ssh key
 */
var sshKeyPath = helpers.getUserHome() + "/.ssh/id_rsa";

/**
 * Logout of Codemason
 */
var logout = function(req, next, abort) {

    config = req.argv;

    helpers.log("\n   Logging out of your Codemason account \n");

    logout.deleteKey()
            .then(logout.clearPersistedData)
            .then(function() {
                helpers.log("   ✔ You have been signed out".green);
                helpers.log();

                // Track
                helpers.analytics.track({
                    userId: helpers.getTrackingUserId(),
                    event: 'Logged Out',
                })
            })

}

/**
 * Delete the SSH key for this user
 */
logout.deleteKey = function() {
    return new Promise(function(resolve, reject) {

        // Delete SSH key for this user
        request.delete({
            url: config.endpoint + '/v1/git/keys?api_token=' + storage.getItem('token'),
            json: true,
            form: { 
                title: os.hostname(),
                key: helpers.getSSHKey(sshKeyPath).toString()
            }
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                helpers.log("   ✗ Logout failed".red);
                helpers.log();
                reject();
                return;
            }

            resolve();

        });

    });
    
}

/**
 * Clear the persisted data
 */
logout.clearPersistedData = function() {
    return new Promise(function(resolve, reject) {
            storage.removeItem('token');
            storage.removeItem('user');
            resolve();
    });
}

module.exports = logout;
