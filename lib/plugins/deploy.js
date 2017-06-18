var _ = require('lodash');
var read = require('read');
var YAML = require('yamljs');
var request = require('request');
var env = require('node-env-file');
var child = require('child_process');
var storage = require('node-persist');
var ProgressBar = require('progress');
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
 * Options for the progress bar
 */
var progressBarOptions = { 
    total: 30,
    width: 20,
    incomplete: ' ',
    complete: '=',
}

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
            .then(deploy.getCurrentBuild)
            .then(deploy.watchBuild)
            .then(deploy.prepareMasonJson)
            .then(deploy.launch)
            .then(function() {
                helpers.log();
                helpers.log("     *´¨)".yellow);
                helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
                helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application deployed and running with Codemason".white);
                helpers.log();
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
        
        // Create upload progress bar
        var bar = new ProgressBar('      Uploading [:bar] ' + ':percent'.yellow + ' :etas', progressBarOptions);

        // Start progress bar at 0 so it displays
        bar.tick(0);

        // Simulate the upload progress for the user experience
        var timer = setInterval(function () {
            bar.tick();

            // When we hit total, start the next stage 
            if(bar.curr == bar.total - 1) {
                bar.tick(bar.total * -1);
            }
        }, 600);

        // Sync code to Codemason
        var cmd = child.exec('git push ' + deploy.config.remote + ' master --porcelain');
        
        // Recieved a stdout message, increment progress bar
        cmd.stdout.on('data', function(data) {
            bar.tick();
        });
        
        // Warnings or errors, abort script
        cmd.stderr.on('data', function(data) {
            helpers.warning(data);
        });
        
        // Command finished
        cmd.on('close', function(code) {
            if(code == 0) { // things went smoothly
                bar.tick(bar.total);
                clearInterval(timer);
            } else { // something went wromg
                clearInterval(timer);
                bar.terminate();
                helpers.abort("Could not sync code to Codemason");
            }
            resolve();
        });

    });

}

/**
 * Get the current (latest) build for project
 */
deploy.getCurrentBuild = function() {

    return new Promise(function(resolve, reject) {

        deploy.getBuilds()
                .then(function(builds) {
                    resolve(builds[0]);
                })
                .catch(function(error) {
                    helpers.warning(error);
                    helpers.abort("Failed to fetch current build");
                    return;
                });

    });
}  

/**
 * Get builds for project
 */
deploy.getBuilds = function() {
    
    return new Promise(function(resolve, reject) {
  
        // Get current build
        request.get({
            url: deploy.config.endpoint + '/v1/git/projects/' + deploy.config.project + '/builds?api_token=' + token,
            json: true,
        }, function(error, response, body) {

            if(error || body.errors || body.error != undefined) {
                reject(error || body.errors || body.error);
                return;
            }

            resolve(body);

        });

    });

}

/**
 * Get a single build for a project 
 */
deploy.getBuild = function(project, build) {
    
    return new Promise(function(resolve, reject) {  
    
        request.get({
            url: deploy.config.endpoint + '/v1/git/projects/' + deploy.config.project + '/builds/' + build + '?api_token=' + token,
            json: true,
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                helpers.log("   ✗ Could get build".red);
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
  
        // Create upload progress bar
        var bar = new ProgressBar('       Building [:bar] ' + ':percent'.yellow + ' :etas:status', progressBarOptions);

        // Additional tokens for progress bar
        var tokens = {
            status: "",
        };

        // Start progress bar at 0 so it displays
        bar.tick(0, tokens);

        // Simulate the upload progress for the user experience
        var timer = setInterval(function () {
            bar.tick(tokens);

            // When we hit total, start the next stage 
            if(bar.curr == bar.total - 1) {
                bar.tick(bar.total * -1, tokens);
            }
        }, 1500);

        // Get the build status
        function getBuildStatus() {
            deploy.getBuild(deploy.config.project, build.id).then(function(build) {
                if(build.status == "success") { // build completed
                    bar.tick(bar.total, {status: ", " + "✔ passed".green});
                    clearInterval(timer);
                    resolve();
                } else if(build.status == "pending" || build.status == "running") { // build in progress
                    getBuildStatus();
                } else { // build failed or cancelled
                    bar.tick(bar.total, {status: ", " + "✗ failed".red});
                    clearInterval(timer);
                    bar.terminate();
                    helpers.abort("Failed to complete build");
                }
            })
        }

        // Keep getting the current build UNTIL status != pending || running
        getBuildStatus();

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

            // Replace build parameter with Docker image
            if(_.has(service, 'build')) {

                // Remove build, use image
                delete service.build;
                delete service.volumes; 

                // Set image as repo's image
                service.image = deploy.config.registry + "/" + deploy.config.project;

                // Load environment file, if available 
                if(helpers.fileExists('.env')) {
                    service.environment = _.merge(masonJson.app.environment, env('.env'));
                }

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

        // Create upload progress bar
        var bar = new ProgressBar('      Launching [:bar] ' + ':percent'.yellow + ' :etas', progressBarOptions);

        // Start progress bar at 0 so it displays
        bar.tick(0);

        // Simulate the upload progress for the user experience
        var timer = setInterval(function () {
            bar.tick();

            // When we hit total, start the next stage 
            if(bar.curr == bar.total - 1) {
                bar.tick(bar.total * -1);
            }
        }, 600);

        // Deploy
        var requests = _.map(masonJson, function(service) {
            return new Promise(function(resolve, reject) {

                request.post({
                    url: deploy.config.endpoint + '/v1/' + deploy.config.team + '/services?application=' + deploy.config.application + '&environment=' + deploy.config.environment + '&api_token=' + token,
                    json: true,
                    form: service
                }, function(error, response, body) {

                    if(error || body.errors != undefined || response.statusCode == 422) {
                        helpers.warning(body);
                        helpers.abort("Failed to launch application.");
                        return;
                    }

                    // Track 
                    helpers.analytics.track({
                        userId: helpers.getTrackingUserId(),
                        event: 'Deployed a Service',
                    });

                    bar.tick(bar.total);
                    clearInterval(timer);
                    resolve(body);

                });

            });
        });

        Promise.all(requests).then(function() {
            resolve();
        });

    });

}


module.exports = deploy;
