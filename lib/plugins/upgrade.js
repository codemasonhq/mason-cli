var _ = require('lodash');
var read = require("read");
var Spinner = require('ora');
var request = require("request");
var child = require('child_process');
var storage = require("node-persist");
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
 * Upgrade service on Codemason
 */
var upgrade = function(req, next, abort) {

    config = req.argv;
    deploy.config = config;
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

    upgrade.getService(req.argv._[0])
            .then(deploy.upload)
            .then(deploy.getCurrentBuild)
            .then(deploy.watchBuild)
            .then(upgrade.prepareMasonJson)
            .then(upgrade.launch)
            .then(function() {
                helpers.log();
                helpers.log("     *´¨)".yellow);
                helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
                helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application upgraded and running with Codemason".white);
                helpers.log();
            });

}

/**
 * Get the service being referenced
 */
upgrade.getService = function(reference) {
    
    return new Promise(function(resolve, reject) {  

        request.get({
            url: config.endpoint + '/v1/' + config.team + '/services/' + reference + '?environment=' + config.environment + '&api_token=' + token,
            json: true,
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                helpers.log("   ✗ Could find service".red);
                return;
            }

            upgrade.service = body;
            resolve(body);

        });

    })

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
            environment: _.get(upgrade.service, 'rancher.launchConfig.environment'),
            ports: _.get(upgrade.service, 'rancher.launchConfig.ports'),
            volumes: _.get(upgrade.service, 'rancher.launchConfig.dataVolumes'),
            labels: {
                "io.rancher.container.pull_image": "always",
            }
        }
        
        resolve(masonJson);

    });

}

/**
 * Upgrade app on Codemason
 */
upgrade.launch = function(masonJson) {

    return new Promise(function(resolve, reject) {

        // Create launching spinner
        var spinner = new Spinner({
            color: 'magenta', 
            text: "Launching", 
            spinner: helpers.SPINNER,
        }).start()

        // Deploy
        request.put({
            url: config.endpoint + '/v1/' + config.team + '/services/' + upgrade.service.id + '?environment=' + config.environment + '&api_token=' + token,
            json: true,
            form: masonJson 
        }, function(error, response, body) {

            if(error || body.errors != undefined) {
                spinner.stopAndPersist({symbol: "      ✗ ".red, text: "Launch failed"});
                helpers.warning(body);
                helpers.abort("Failed to upgrade service.");
                return;
            }

            // Track 
            helpers.analytics.track({
                userId: helpers.getTrackingUserId(),
                event: 'Upgraded a Service',
            });

            spinner.stopAndPersist({symbol: "      ✔ ".green, text: "Launched"});
            resolve(body);

        });

    });

}


module.exports = upgrade;
