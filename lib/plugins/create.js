var _ = require('lodash');
var path = require("path");
var read = require("read");
var namor = require("namor");
var login = require("./login");
var request = require("request");
var child = require('child_process');
var storage = require("node-persist");
var helpers = require("../util/helpers");

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
 * Generate a random application name
 */
var applicationName = namor.generate();

/**
 * Generate a random service name
 */
var serviceName = "web"; 

/**
 * By default, we expect the service to be in the cwd
 */
var servicePath = helpers.CURRENT_WORKING_DIR; 

/**
 * Creates an application on Codemason
 */
var create = function(req, next, abort) {

    config = req.argv;
    applicationName = req.argv.application ? req.argv.application : applicationName;
    serviceName = req.argv.service ? req.argv.service : serviceName;
    servicePath = req.argv.path ? req.argv.path : servicePath;

    helpers.log("");
    helpers.log("   Creating application on Codemason...".white);
    helpers.log("");

    create.authCheck(req, next, abort)
            .then(create.requestApplicationName)
            .then(create.requestServiceName)
            .then(create.requestServicePath)
            .then(create.createApplication)
            .then(create.createGitRemote)
            .then(function() {
                helpers.log();
            })
            .catch(function(errors) {
                helpers.log("   ✗ Create application failed".red);
                _.each(errors, function(error) {
                    helpers.log("     ↪  " + error);
                })
            });
}

/**
 * Ensure the user is logged in
 */
create.authCheck = function(req, next, abort) {
    return new Promise(function(resolve, reject) {
        if(storage.getItem('user') == undefined) {
            helpers.warning("User not logged in");
            resolve(login(req, next, abort))
        } else {
            resolve();
        }
    })
}

/**
 * Request a name for the new application
 */
create.requestApplicationName = function() {
    return new Promise(function(resolve, reject) {
        read({ // request application name
            prompt: helpers.INVISIBLE_CHARACTER + "     Application name",
            default: applicationName.yellow
        }, function(err, response) {

            // Avoid using the coloured default value
            if(applicationName.yellow != response) {
                applicationName = response;
            }

            resolve();

        });
    });
}

/**
 * Request a name for the new service
 */
create.requestServiceName = function() {
    return new Promise(function(resolve, reject) {
        read({ // request service name
            prompt: helpers.INVISIBLE_CHARACTER + "         Service name",
            default: serviceName.yellow
        }, function(err, response) {

            // Avoid using the coloured default value
            if(serviceName.yellow != response) {
                serviceName = response;
            }

            resolve();

        });
    });
}

/**
 * Where is source of the service located?
 */
create.requestServicePath = function() {
    return new Promise(function(resolve, reject) {
        read({ // request path to service source
            prompt: helpers.INVISIBLE_CHARACTER + "         Service path",
            default: servicePath.yellow
        }, function(err, response) {

            // Avoid using the coloured default value
            if(servicePath.yellow != response) {
                servicePath = response;
            }

            resolve();

        });
    });
}

 /**
  * Create application on Codemason
  */
create.createApplication = function() {

    return new Promise(function(resolve, reject) {
        
        helpers.log();

        // Update token
        token = storage.getItem('token');

        // Create Application
        request.post({
            url: config.endpoint + '/v1/' + config.team + '/applications?environment=' + config.environment + '&api_token=' + token,
            json: true,
            form: { 
                masonVersion: "v1",
                type: "application",
                name: applicationName
            }
        }, function(error, response, body) {

            if(!helpers.isSuccessful(response.statusCode)) {
                reject(_.flatten(_.toArray(error || body.error || body)))
                return;
            }

            helpers.log("   ✔ Created application".green);
            helpers.log("   ✔ Created remote repository".green);
            
            // Track
            helpers.analytics.track({
                userId: helpers.getTrackingUserId(),
                event: 'Created an Application',
            });

            resolve();

        });

    });

}

/**
 * Create a git remote for Codemason on users computer
 */
create.createGitRemote = function(project) {

    return new Promise(function(resolve, reject) {

        try {
            child.execSync('git remote add codemason git@git.mason.ci:' + config.team.toLowerCase() + '/' + applicationName.toLowerCase(), {stdio: 'pipe'});
            helpers.log("   ✔ Added git remote codemason".green);
            resolve(project);
        } catch(e) {
            helpers.warning("Could not add git remote");
            console.log(e.message);
        }

    });

}

module.exports = create;
