var child = require('child_process');
var request = require("request");
var storage = require("node-persist");
var ProgressBar = require('progress');
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

    config = req.config;
    
    // Fetch the git remote
    try {
        config.project = helpers.getProjectFromGitRemote(config.git);
        config.namespace = config.project.split("/")[0];
        config.path = config.project.split("/")[1];
    } catch(e) {
        helpers.abort("Could not read git remote");
    }

    helpers.log("");
    helpers.log("   Deploying application to Codemason...".white);
    helpers.log("");

    deploy.upload()
            .then(deploy.getCurrentBuild)
            .then(deploy.watchBuild)
            .then(deploy.prepareMasonJson)
            .then(deploy.launch)
            .then(function() {
                helpers.log();
                helpers.log("     *´¨)".yellow);
                helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
                helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application deployed and running at ".white + "hello-world-1234.mason.ci".underline.green);
                helpers.log();
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
        var cmd = child.exec('git push ' + config.remote + ' master --porcelain');
        
        // Recieved a stdout message, increment progress bar
        cmd.stdout.on('data', function(data) {
            bar.tick();
        });
        
        // Command failed, abort script
        cmd.stderr.on('data', function(data) {
            clearInterval(timer);
            bar.terminate();
            helpers.abort(data);
        });
        
        // Command finished
        cmd.on('close', function(code) {
            if(code == 0) { // things went smoothly
                bar.tick(bar.total);
                clearInterval(timer);
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
                    helpers.log(error);
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
            url: config.endpoint + '/v1/git/projects/' + config.project + '/builds?api_token=' + token,
            json: true,
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                reject(error || body.errors);
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
            url: config.endpoint + '/v1/git/projects/' + config.project + '/builds/' + build + '?api_token=' + token,
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
            deploy.getBuild(config.project, build.id).then(function(build) {
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
        masonJson = {
            name: config.path,
            masonVersion: "v1",
            type: "application",
            instances: [
                {
                    name: "app",
                    image: "docker:" + config.registry + "/" + config.project,
                    type: "instance",
                    environment: {
                        "APP_ENV": "local",
                        "APP_KEY": "base64:1NLYNDTY5rLXX5B/ZunvVmfeOB1A6cV/1RPiJDO1Q0k=",
                        "APP_DEBUG": "true"
                    },
                    // ports: [
                        // "80",
                        // "443"
                    // ],
                }
            ],
        }

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
        request.post({
            url: config.endpoint + '/v1/deploy/' + config.environment + '/' + config.path + '?api_token=' + token,
            json: true,
            form: masonJson 
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                console.log(body);
                helpers.abort("Failed to launch application.");
                return;
            }

            bar.tick(bar.total);
            clearInterval(timer);
            resolve(body);

        });

    });

}


module.exports = deploy;
