var _ = require('lodash');
var read = require('read');
var YAML = require('yamljs');
var Spinner = require('ora');
var request = require('request');
var env = require('node-env-file');
var child = require('child_process');
var storage = require('node-persist');
var helpers = require('../util/helpers');

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
 * Deploy application to Codemason
 */
var deploy = function(req, next, abort) {

    deploy.config = req.argv;
    
    // Fetch the git remote
    try {
        deploy.config.project = helpers.getProjectFromGitRemote(deploy.config.git);
    } catch(e) {
        helpers.abort("Could not read git remote");
    }

    helpers.log("");
    helpers.log("   Deploying application to Codemason...".white);
    helpers.log("");

    deploy.requestApplicationName()
            .then(deploy.upload)
            .then(deploy.watchBuild)
            .then(deploy.prepareMasonJson)
            .then(deploy.launch)
            .then(function() {
                helpers.log();
                helpers.log("     *´¨)".yellow);
                helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
                helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application deployed and running with Codemason".white);
                helpers.log();
            })
            .catch(function(error) {
                helpers.log();
                helpers.log("   ✗ Failed to deploy app".red);
                helpers.logError(error);
            });

}

/**
 * Request the name of the application name for the new application
 */
deploy.requestApplicationName = function() {
    return new Promise(function(resolve, reject) {
        if(deploy.config.to != undefined) {
            deploy.config.application = deploy.config.to;
            resolve();
        } else {
            read({ // request application name
                prompt: helpers.INVISIBLE_CHARACTER + "     Choose application to deploy to:",
            }, function(err, response) {
                deploy.config.application = response;
                resolve();
            });
        }
    });
}

/**
 * Upload the app source to git remote
 */
deploy.upload = function() {

    return new Promise(function(resolve, reject) {
        
        // Create upload spinner
        var spinner = new Spinner({
            color: 'magenta', 
            text: "Uploading", 
            spinner: helpers.SPINNER,
        }).start()

        // Sync code to Codemason
        var cmd = child.exec('git push ' + deploy.config.remote + ' master --porcelain');

        // Warnings or errors, abort script
        cmd.stderr.on('data', function(data) {
            spinner.stopAndPersist({symbol: "      ✗ ".red, text: "Upload failed"});
            helpers.log("");
            helpers.log(data);
            helpers.abort("Could not sync code to Codemason")
        });
        
        // Command finished
        cmd.on('close', function(code) {
            if(code == 0) { // things went smoothly
                spinner.stopAndPersist({symbol: "      ✔ ".green, text: "Uploaded"});
            } else { // something went wromg
                helpers.abort("Something went wrong when syncing your code")
            }
            resolve();
        });

    });

}

/**
 * Get the current (latest) build for project
 */
deploy.getCurrentBuild = function(spinner) {

    return new Promise(function(resolve, reject) {

        deploy.getBuilds(spinner)
                .then(function(builds) {
                    resolve(builds[0]);
                })
                .catch(function(error) {
                    if(spinner) spinner.stopAndPersist({symbol: "      ✗ ".red, text: "Build failed"});
                    _.set(error, 0, "Could not fetch current build");
                    reject(error);
                    return;
                });

    });
}  

/**
 * Get builds for project
 */
deploy.getBuilds = function(spinner) {
    
    return new Promise(function(resolve, reject) {
  
        // Get current build
        request.get({
            url: deploy.config.endpoint + '/v1/git/projects/' + deploy.config.project + '/builds?api_token=' + token,
            json: true,
        }, function(error, response, body) {

            if(!helpers.isSuccessful(response.statusCode)) {
                reject(body);
                return;
            }

            resolve(body);

        });

    });

}

/**
 * Get a single build for a project 
 */
deploy.getBuild = function(spinner, project, build) {
    
    return new Promise(function(resolve, reject) {  
    
        request.get({
            url: deploy.config.endpoint + '/v1/git/projects/' + deploy.config.project + '/builds/' + build + '?api_token=' + token,
            json: true,
        }, function(error, response, body) {
            
            if(!helpers.isSuccessful(response.statusCode)) {
                spinner.stopAndPersist({symbol: "      ✗".red, text: "Build failed"});
                helpers.abort("Build not found");
                return;
            }

            resolve(body);

        });

    })

}

/**
 * Watch build until it is complete
 */
deploy.watchBuild = function(build) {

    return new Promise(function(resolve, reject) {

        // Create building spinner
        var spinner = new Spinner({
            color: 'magenta', 
            text: "Building", 
            spinner: helpers.SPINNER,
        }).start();

        deploy.getCurrentBuild(spinner).then(function(build) {

            // Get the build status
            function getBuildStatus() {
                deploy.getBuild(spinner, deploy.config.project, build.id).then(function(build) {
                    if(build.status == "success") { // build completed
                        spinner.stopAndPersist({symbol: "      ✔ ".green, text: "Build completed"});
                        resolve();
                    } else if(build.status == "pending" || build.status == "running") { // build in progress
                        getBuildStatus();
                    } else { // build failed or cancelled
                        spinner.stopAndPersist({symbol: "      ✗ ".red, text: "Build failed"});
                        reject(build)
                        return;
                    }
                })
            }

            // Keep getting the current build UNTIL status != pending || running
            getBuildStatus();

        }).catch(function(error) {
            reject(error);
        })

    });

}

/**
 * Ensure that the Mason JSON file is in sync
 * with docker-compose.yml & Dockerfile.
 */
deploy.prepareMasonJson = function() {
    return new Promise(function(resolve, reject) {

        // Load the docker-compose.yml file 
        var dockerCompose = YAML.load('docker-compose.yml');

        // Populate Mason JSON 
        masonJson = dockerCompose.services;

        // Append additional Mason JSON parameters 
        masonJson = _.map(masonJson, function(service, name) {

            // Format environment variables provided in string form
            if(_.isArray(service.environment)) {

                var formatedEnvironment = {};

                // Convert environment variable array into key/value object
                _.forEach(service.environment, function(value) {
                    formatedEnvironment[value.split("=")[0]] = value.split("=")[1];
                });

                // Override existing environment array with the key/value object 
                service.environment = formatedEnvironment;

            }

            // Replace build parameter with Docker image
            if(_.has(service, 'build')) {

                // Remove build, use image
                delete service.build;
                delete service.volumes; 

                // Set image as repo's image
                service.image = deploy.config.registry + "/" + deploy.config.project.toLowerCase();

                // Load environment file, if available 
                if(helpers.fileExists('.env')) {
                    service.environment = _.merge(service.environment, env('.env'));
                }

            }

            // Parse linked services
            if(_.has(service, 'links')) {
                helpers.warning("Stripped `links` parameter. You may add links manually via the UI.")
                delete service.links
            }

            service.name = name;
            service.type = "service";
            service.masonVersion = "v1";
            service.volumes = _.map(service.volumes, function(volume) {
                return (volume[0] == '.') ? volume.substr(1) : volume;
            });

            return service;

        })
        
        resolve(masonJson);

    });

}

/**
 * Launch app on Codemason
 */
deploy.launch = function(masonJson) {

    return new Promise(function(resolve, reject) {

        // Create launching spinner
        var spinner = new Spinner({
            color: 'magenta', 
            text: "Launching", 
            spinner: helpers.SPINNER,
        }).start()

        // Deploy
        var requests = _.map(masonJson, function(service) {
            return new Promise(function(resolve, reject) {

                request.post({
                    url: deploy.config.endpoint + '/v1/' + deploy.config.team + '/services?application=' + deploy.config.application + '&environment=' + deploy.config.environment + '&api_token=' + token,
                    json: true,
                    form: service
                }, function(error, response, body) {

                    if(!helpers.isSuccessful(response.statusCode)) {
                        reject(body)
                        return;
                    }

                    // Track 
                    helpers.analytics.track({
                        userId: helpers.getTrackingUserId(),
                        event: 'Deployed a Service',
                    });

                    resolve(body);

                });

            });
        });

        Promise.all(requests).then(function() {
            spinner.stopAndPersist({symbol: "      ✔ ".green, text: "Launched"});
            resolve();
        }).catch(function(error) {
            spinner.stopAndPersist({symbol: "      ✗ ".red, text: "Launch failed"});
            reject(error);
            return;
        })

    });

}


module.exports = deploy;
