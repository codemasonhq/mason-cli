var _ = require("lodash");
var read = require('read');
var path = require('path');
var fs = require('fs-extra');
var rimraf = require('rimraf');
var exists = require('fs').existsSync;
var Handlebars = require('handlebars');
var helpers = require('../util/helpers');
var download = require('download-git-repo');
/**
 * Override the default services defined in the craft kit.
 */
var argWith;

/**
 * Use `git clone` so SSH keys are used 
 */
var argClone; 

/**
 * List of services this app is being crafted with
 */
var craftWith;

/**
 * Location where craft kit is temporarily stored
 */
var tmpPath;

/**
 * We use Mason JSON internally just make it a 
 * little bit easier dealing with all the 
 * Docker configruation options.
 * 
 * Reference: http://mason.ci/docs/mason-json
 */
var masonJson = {
    name: "",
    description: "",
    masonVersion: "v1",
    services: [],
};

/**
 * List of adjectives to pick from in the success message 
 * ¯\_(ツ)_/¯ 
 */
var adjectives = ["amazing", "cool", "beautiful", "super", "sweet", "legendary", "exciting", "challenging"];

/**
 * Constructor for the `craft` command
 *
 * Use an official craft kit for your application. 
 * $ mason craft laravel
 * 
 * Specify services to craft your application with.
 * $ mason craft laravel --with="php, postgres"
 * 
 * Use a custom craft kit for your application.
 * $ mason craft username/repo 
 *
 * Use a local craft kit for your application.
 * $ mason craft ~/path/to/craft-kit
 */
var craft = function(req, next, abort) {

    argWith = req.argv.with;
    argClone = req.argv.clone; 

    craft.resolveKit(req.argv._[0])
            .then(craft.loadKit)
            .then(function(kit) {
                
                // Prepare our Mason JSON 
                craft.prepareMasonJSON(kit);

                // Tell the user
                helpers.log();
                helpers.log("   Crafting " + kit.name.green + " application with " + craftWith.join(", ").green);
                helpers.log();

            })
            .then(function() { // Add Dockerfile to app  
                return craft.compileDockerfile(req.argv.dockerfile);
            })
            .then(function() { // Add Dockerfile to app
                return craft.compileDockerCompose(req.argv.dockercompose)
            })
            .then(function() { // Add .gitlab-ci.yml file to app
                return craft.compileGitLabCI(req.argv.gitlab)
            })
            .then(craft.clean)
            .then(function() { // Complete
                var adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
                helpers.log();
                helpers.log("   ✔ Build something ".green + adjective.green);
                helpers.log();
            });

}


/**
 * Does all the heavy lifting for craft kits.
 * Detects if a kit is official, custom or local
 * craft kit and downloads the craft kits as required.
 */
craft.resolveKit = function(kit) {

    return new Promise(function(resolve, reject) {

        if(exists(kit)) {
            
            resolve({
                type: 'local',
                path: kit,
            });

        } else {

            // No slash means use official 
            var isOfficial = (kit.indexOf('/') == -1)

            // Prepare the repo url to retrieve the craft kit from
            var repo = isOfficial ? 'codemasonhq/craft-kit-' + kit : kit;

            // Download the craft kit
            craft.download(repo)
                    .then(function(path) {
                        resolve({
                            type: isOfficial ? 'official' : 'custom',
                            path: path,
                        })
                    })

        }

    });

}

/**
 * Download the craft kit from a git repo 
 */ 
craft.download = function(repo) {

    return new Promise(function(resolve, reject) {

        tmpPath = '/tmp/codemason/craft-kit-' + Math.random().toString(35).substr(2, 7);

        download(repo, tmpPath, function (error) {
            if(error) helpers.abort('Failed to download repo ' + repo + ': ' + error.message.trim())
            resolve(tmpPath);
        });

    });

}

/**
 * Load kit
 */
craft.loadKit = function(kitInfo) {
    try {
        return require(path.join(kitInfo.path, 'index.js'));
    } catch(e) {
        helpers.abort("Could not load craft kit. It appears to be incorrectly formatted.");
    }
}

/**
 * Prepare Mason JSON
 */
craft.prepareMasonJSON = function(kit) {

    // Get the list of services we're crafting with
    craftWith = argWith ? argWith : kit.default;

    // Convert a --with string to an array
    if(typeof craftWith == "string") {
        craftWith = _.map(craftWith.split(","), _.trim);
    }

    // Pull out the Mason JSON 
    var serviceList = _.pick(kit.masonJson, craftWith);

    // Warn the user if they've attempted to use an unsupported service
    if(craftWith.length != _.size(serviceList)) {
        helpers.warning("Attempted to use an unsupported service - ignored.")
    }

    // Add services to Mason JSON
    masonJson.services = _.filter(serviceList, ['type', 'service']);

    // Send a warning if more than one service needs to be built
    if(_.filter(masonJson.services, 'base').length > 1) {
        // todo: add prompt to get them to choose(?)
        helpers.warning("More than one service is needing to be built. Manual intervention may be required." 
                        + "\n\t\t > The craft command is not designed to handle more than one service needing to be built. ");

    }

    return masonJson;

}

/**
 * Compile `Dockerfile` and add to app source
 */ 
craft.compileDockerfile = function(templateFile, context, overwrite) {

    // Get Dockerfile template
    var source = craft.getTemplateFile(templateFile || path.join(helpers.PACKAGE_DIR, "./stubs/Dockerfile"));

    // Prep the handlebars template
    var template = Handlebars.compile(source);

    // Context data to evaluate Handlebars template with 
    var context = context || _.get(_.filter(masonJson.services, 'base'), 0, { base: 'ubuntu'});

    // Compile
    var result = template(context);

    // Write
    return craft.writeFile('Dockerfile', result);

}

/**
 * Compile `docker-compose.yml` and add to app source
 */
craft.compileDockerCompose = function(templateFile, context, overwrite) {

    // Get Dockerfile template
    var source = craft.getTemplateFile(templateFile || path.join(helpers.PACKAGE_DIR, "./stubs/docker-compose.yml"));

    // Prep the handlebars template
    var template = Handlebars.compile(source);

    // Replacement data for handlebars
    var context = context || masonJson;

    // Compile
    var result = template(context);

    // Write
    return craft.writeFile('docker-compose.yml', result);

}

/**
 * Compile `.gitlab-ci.yml` and add to app source.
 * 
 * The default .gitlab-ci.yml file should retain its identifiers so
 * they can be replaced when the `$ mason create` command is run.
 */
craft.compileGitLabCI = function(templateFile, context, overwrite) {
   
    // Get Dockerfile template
    var source = craft.getTemplateFile(templateFile || path.join(helpers.PACKAGE_DIR, "./stubs/.gitlab-ci.yml"));

    // Prep the handlebars template
    var template = Handlebars.compile(source);

    // Replacement data for handlebars
    var context = context || {};

    // Compile
    var result = template(context);

    // Write
    return craft.writeFile('.gitlab-ci.yml', result, overwrite);

}

/**
 * Grab template file 
 */
craft.getTemplateFile = function(templateFile) {
    try {
        return fs.readFileSync(templateFile, 'utf8');
    } catch (error) {
        helpers.abort("Error: there was a problem reading template " + error);
    }
}

/**
 * Write file to file system
 */
craft.writeFile = function(filename, contents, overwrite) {

    // Actually write the file
    function writeFile(filename, contents) {
        try {
            
            fs.writeFileSync(filename, contents, { encoding: 'utf8' });
            
            // Silence output if forced overwrite set
            if(!overwrite) {
                helpers.log(`      + Wrote ${ filename.yellow }`);
            }

        } catch(e) {
            helpers.abort(`Error: writing ${ filename }: (${ e.message })`);
        }
    }

    return new Promise(function(resolve, reject) {
        
        // Ensure we are actually allowed to write the file
        if(helpers.fileExists(filename)) {
            craft.confirmFileOverwrite(filename, overwrite).then(function(response) {
                if(response == "yes") {
                    writeFile(filename, contents)
                }
                resolve();
            })
        } else {
            writeFile(filename, contents);
            resolve();
        }

    });

}

/**
 * Request confirmation from user that it's alright
 * to overwrite one of their existing files.
 */
craft.confirmFileOverwrite = function(filename, overwrite) {

    return new Promise(function(resolve, reject) {

        // Force save, don't ask for requests
        if(overwrite == true) {
            resolve("yes");
            return;
        }

        read({ // ask user to confirm file overwrite 
            prompt: helpers.INVISIBLE_CHARACTER + "     ⬩ Overwrite existing ".yellow + filename.yellow + " file? [yes/no]".yellow,
            default: 'no',
        }, function(err, response) {
            switch(response) {
                default: 
                    // `undefined` occurs when the user exists the script
                    if(response != undefined) { 
                        helpers.log("        ↪ Invalid response: " + response);
                        resolve(craft.confirmFileOverwrite(filename));
                    }
                break;

                case "yes":
                case "y":
                    resolve("yes"); 
                break;

                case "no":
                case "n":
                    resolve("no");
                break;
            }
        });
    });

}

/**
 * Clean up after ourselves 
 */
craft.clean = function() {
    if(tmpPath) {
        rimraf(tmpPath, function (error) {
            if(error) {
                helpers.abort('Failed to remove tmp files ' + tmpPath);
                console.log(error);
            }
        })
    }
}

module.exports = craft;
