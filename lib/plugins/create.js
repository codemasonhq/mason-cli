var path = require("path");
var read = require("read");
var namor = require("namor");
var request = require("request");
var child = require('child_process');
var storage = require("node-persist");
var helpers = require("../util/helpers");
var craft = require("./craft");

storage.initSync(helpers.initSyncOptions);

var applicationName = namor.generate();
var applicationPath = helpers.CURRENT_WORKING_DIR; 
var applicationDomain = applicationName + ".mason.ci";

var token = storage.getItem('token');

var create = function(req, next, abort) {

    helpers.log("");
    helpers.log("   Creating application on Codemason...".white);
    helpers.log("");

    create.requestApplicationName()
            .then(create.requestApplicationPath)
            .then(create.requestApplicationDomain)
            .then(create.createApplication)
            .then(create.createRepository)
            .then(create.createGitRemote)
            .then(create.compileGitLabCI)
            .then(function() {
                helpers.log();
            });
            
}


create.requestApplicationName = function() {
    return new Promise(function(resolve, reject) {
        read({ // request their email first
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

create.requestApplicationPath = function() {
    return new Promise(function(resolve, reject) {
        read({ // request their email first
            prompt: helpers.INVISIBLE_CHARACTER + "     Application path",
            default: applicationPath.yellow
        }, function(err, response) {

            // Avoid using the coloured default value
            if(applicationPath.yellow != response) {
                applicationPath = response;
            }

            resolve();

        });
    });
}

create.requestApplicationDomain = function() {
    return new Promise(function(resolve, reject) {
        read({ // request their email first
            prompt: helpers.INVISIBLE_CHARACTER + "               Domain",
            default: applicationDomain.yellow
        }, function(err, response) {

            // Avoid using the coloured default value
            if(applicationDomain.yellow != response) {
                applicationDomain = response;
            }

            resolve();

        });
    });
}

/**
 * Send POST that creates application on Codemason
 */
create.createApplication = function() {

    return new Promise(function(resolve, reject) {
        
        helpers.log();

        // Create Application
        request.post({
            url: 'http://localhost:8080/v1/applications?api_token=' + token,
            json: true,
            form: { 
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
            url: 'http://localhost:8080/v1/git/projects?api_token=' + token,
            json: true,
            form: { 
                name: applicationName
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

create.createGitRemote = function(project) {

    return new Promise(function(resolve, reject) {

        try {
            child.execSync('git remote add codemason ' + project.http_url_to_repo, {stdio: 'pipe'});
            helpers.log("   ✔ Added git remote codemason".green);
            resolve(project);
        } catch(e) {
            console.log(e);
        }

    });

}

create.compileGitLabCI = function() {

    return new Promise(function(resolve, reject) {

        // Build our context from the users responses
        var context = {
            registry: 'registry.mason.ci',
            path: project.path_with_namespace
        }

        // Recompile the .gitlab-ci.yml file
        craft.compileGitLabCI(path.join(applicationPath, '.gitlab-ci.yml'), context, true);

        // Resolve our promise
        resolve();

    });

}

module.exports = create;
