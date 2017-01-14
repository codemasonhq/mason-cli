var path = require("path");
var read = require("read");
var namor = require("namor");
var request = require("request");
var child = require('child_process');
var storage = require("node-persist");
var helpers = require("../util/helpers");
var craft = require("./craft");

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

    config = req.config;
    applicationName = req.argv.application ? req.argv.application : applicationName;
    serviceName = req.argv.service ? req.argv.service : serviceName;
    servicePath = req.argv.path ? req.argv.path : servicePath;

    helpers.log("");
    helpers.log("   Creating application on Codemason...".white);
    helpers.log("");

    create.requestApplicationName()
            .then(create.requestServiceName)
            .then(create.requestServicePath)
            .then(create.createApplication)
            .then(create.createRepository)
            .then(create.createGitRemote)
            .then(create.compileGitLabCI)
            .then(function() {
                helpers.log();
            });
            
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

        // Create Application
        request.post({
            url: config.endpoint + '/v1/applications?api_token=' + token,
            json: true,
            form: { 
                masonVersion: "v1",
                type: "application",
                name: applicationName
            }
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                helpers.log("   ✗ Create application failed".red);
                return;
            }

            helpers.log("   ✔ Created application".green);
            resolve();

        });

    });

}

/**
 * Create remote repository on Codemason Git server
 * Then add it as a git remote for the user.
 */
create.createRepository = function() {

    return new Promise(function(resolve, reject) {
        
        // Create Application
        request.post({
            url: config.endpoint + '/v1/git/projects?api_token=' + token,
            json: true,
            form: { 
                name: applicationName + "_" + serviceName
            }
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                helpers.log("   ✗ Create remote repository failed".red);
                return;
            }

            helpers.log("   ✔ Created remote repository".green);
            resolve(body);

        });

    });

}

/**
 * Create a git remote for Codemason on users computer
 */
create.createGitRemote = function(project) {

    return new Promise(function(resolve, reject) {

        try {
            child.execSync('git remote add codemason ' + project.ssh_url_to_repo, {stdio: 'pipe'});
            helpers.log("   ✔ Added git remote codemason".green);
            resolve(project);
        } catch(e) {
            helpers.warning("Could not create git remote");
            console.log(e);
        }

    });

}

/**
 * Take the .gitlab-ci.yml file created by the craft command
 * and replace the identifiers with the context provided.
 */
create.compileGitLabCI = function(project) {

    return new Promise(function(resolve, reject) {

        // Build our context from the users responses
        var context = {
            registry: config.registry,
            path: project.path_with_namespace
        }

        // Recompile the .gitlab-ci.yml file
        craft.compileGitLabCI(path.join(servicePath, '.gitlab-ci.yml'), context, true);

        // Resolve our promise
        resolve();

    });

}

module.exports = create;
