var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var request = require("request");
var child = require('child_process');
var storage = require('node-persist');
var configCommand = require("./config");
var helpers = require("../util/helpers");
var os = require("os");
var hostname = os.hostname();

storage.initSync(helpers.initSyncOptions);

/**
 * Config passed to plugin through dispatcher 
 */
var config;

/**
 * Path to users ssh key
 */
var sshKeyPath = helpers.getUserHome() + "/.ssh/id_rsa";


/**
 * Login to Codemason
 */
var login = function(req, next, abort) {
    return new Promise(function(resolve, reject) {

        config = req.argv;

        helpers.log("\n   Please login or create an account by entering an email and password: \n");
        helpers.log("          Site: " + config.endpoint.green);

        login.requestCredentials(req)
                .then(login.authenticate)
                .then(login.uploadKey)
                .then(login.handleLoginSuccess)
                .then(function() {
                    resolve();
                })
                .catch(function(errors) {
                    helpers.log("   ✗ Login failed".red);
                    _.each(errors, function(error) {
                        helpers.log("     ↪  " + error);
                    })
                });
    
    });
}

/**
 * Request login credentials from user
 */
login.requestCredentials = function(req) {
    return new Promise(function(resolve, reject) {
        req.read({ // request their email first
            prompt: helpers.INVISIBLE_CHARACTER + "        Email: ",
        }, function(err, email) {
            req.read({ // then their password
                prompt: helpers.INVISIBLE_CHARACTER + "     Password: ",
                silent: true,
                replace: "*",
            }, function(err, password) { // fulfil promise 
                resolve({
                    email: email,
                    password: password,
                })
            });
        });
    });
}

/**
 * Authenticate the user and store get a JWT token
 */
login.authenticate = function(credentials) {

    return new Promise(function(resolve, reject) {

        // Login, get access token and store it.
        request.post({
            url: config.endpoint + '/v1/token',
            json: true,
            form: { 
                email: credentials.email,
                password: credentials.password,
                token_name: "Mason CLI - " + os.hostname().split('.').shift(),
            }
        }, function(error, response, body) {

            if(!helpers.isSuccessful(response.statusCode)) {
                reject(_.flatten(_.toArray(error || body.error || body)))
                return;
            }

            storage.setItem('token', body.token);
            storage.setItem('user', body.user);
            configCommand.set('team', body.team.slug);
            
            resolve();

        });

    });
    
}

/** 
 * Upload their public SSH key to Codemason
 * so user's machine is recognised by git
 */
login.uploadKey = function() {

    // TODO: Fix this so it works on Windows too(?)
    function generateKey() {
        child.execSync("ssh-keygen -t rsa -f " + sshKeyPath + " -q -N ''");
        return helpers.getSSHKey(sshKeyPath);
    }

    return new Promise(function(resolve, reject) {

        var key = helpers.getSSHKey(sshKeyPath);
        if(key == false) {
            helpers.log("   ⬩ Could not find an existing public key".yellow);
            helpers.log("     ↪ Generating new SSH public key")
            helpers.log();

            // Generate key 
            key = generateKey();
        }

        // Upload key
        request.post({
            url: config.endpoint + '/v1/git/keys',
            json: true,
            form: { 
                api_token: storage.getItem('token'),
                title: os.hostname(),
                key: key
            }
        }, function(error, response, body) {

            if(!helpers.isSuccessful(response.statusCode)) {
                
                var errors = _.flatten(_.toArray(error || body.error || body));
                
                // Don't alert the user if the key has already been added
                if(errors.join().indexOf("\"fingerprint\" has already been taken") == -1) {
                    reject(errors);
                    return;
                }

            }

            // Success!
            resolve();

        });
    
    });

}

login.handleLoginSuccess = function() {
    return new Promise(function(resolve, reject) {

        // Alias Anonymous ID if available
        if(storage.getItem('anonymous-id')) {
            
            // Alias
            helpers.analytics.alias({ 
                previousId: storage.getItem('anonymous-id'), 
                userId: storage.getItem('user').id,
            });

            // Remove Anonymous ID
            storage.removeItem('anonymous-id');

        }

        helpers.analytics.identify({
            userId: helpers.getTrackingUserId(),
            traits: {
                id: storage.getItem('user').id,
                name: storage.getItem('user').name,
                email: storage.getItem('user').email,    
            }
        });

        helpers.log("   ✔ Login successful".green);
        helpers.log();

        resolve();

    });
}

module.exports = login;
