var read = require("read");
var request = require("request");
var child = require('child_process');
var storage = require("node-persist");
var ProgressBar = require('progress');
var helpers = require("../util/helpers");
var deploy = require("./deploy");

storage.initSync(helpers.initSyncOptions);

/**
 * Config passed to plugin through dispatcher 
 */
var config;

/**
 * Name of the application being referenced
 */
var application; 

/**
 * Name of the service being upgraded
 */
var service; 

/**
 * Tag of the docker image
 */
var tag = "latest";

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
 * Upgrade service on Codemason
 */
var upgrade = function(req, next, abort) {

    config = req.argv;
    deploy.config = config;

    application = req.argv._[0].split("/")[0];
    service = req.argv._[0].split("/")[1];
    tag = req.argv.tag ? req.argv.tag : tag;

    // Fetch the git remote
    try {
        deploy.config.project = helpers.getProjectFromGitRemote(config.git);
    } catch(e) {
        helpers.abort("Could not read git remote");
    }

    helpers.log("");
    helpers.log("   Upgrading service on Codemason...".white);
    helpers.log("");

    deploy.upload(config.remote)
            .then(deploy.getCurrentBuild)
            .then(deploy.watchBuild)
            .then(upgrade.prepareMasonJson)
            .then(upgrade.launch)
            .then(function() {
                helpers.log();
                helpers.log("     *´¨)".yellow);
                helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
                helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application upgraded and running at ".white + "hello-world-1234.mason.ci".underline.green);
                helpers.log();
            });

}

/**
 * Prepare Mason JSON 
 */
upgrade.prepareMasonJson = function() {
    return new Promise(function(resolve, reject) {

        var masonJson = {
            name: "app",
            type: "service",
            masonVersion: "v1",
            image: deploy.config.registry + "/" + deploy.config.project + ":" + tag,
            environment: {
                "APP_ENV": "local",
                "APP_KEY": "base64:1NLYNDTY5rLXX5B/ZunvVmfeOB1A6cV/1RPiJDO1Q0k=",
                "APP_DEBUG": "true"
            },
            labels: {
                "io.rancher.container.pull_image": "always",
            }
            // ports: [
                // "80",
                // "443"
            // ],
        }
        
        resolve(masonJson);

    });

}

/**
 * Upgrade app on Codemason
 */
upgrade.launch = function(masonJson) {

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
        request.put({
            url: config.endpoint + '/v1/services/' + service + '?api_token=' + token,
            json: true,
            form: masonJson 
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                console.log(body);
                helpers.abort("Failed to upgrade service.");
                return;
            }

            bar.tick(bar.total);
            clearInterval(timer);
            resolve(body);

        });

    });

}


module.exports = upgrade;
