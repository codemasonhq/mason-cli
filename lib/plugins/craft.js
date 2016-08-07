var fs = require('fs-extra');
var read = require("read");
var path = require('path');
var Handlebars = require('handlebars');
var _ = require("lodash");
var helpers = require("../util/helpers")

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
    instances: [],
    services: [],
};

/** 
 * Mason JSON starter stubs 
 * > Could this be converted to a template?
 * > PHP is always the same, mysql is always the same etc.
 */
var masonJsonStubs = {
    php: {
        name: 'php', 
        image: 'codemasonhq/php',
        type: 'instance',
        volumes: {
            './':'/app',
            './logs/nginx/':'/var/log/nginx',
        },
        ports: [
            "80:80",
            "443:443"
        ],
    },
    
    mysql: {
        name: 'mysql',
        image: 'mysql',
        type: 'service',
        volumes: {
            '/var/lib/mysql':'/var/lib/mysql'
        },
        ports: ["3306:3306"],
        environment: {
            'MYSQL_DATABASE': 'demo',
              'MYSQL_USER': 'demo',
              'MYSQL_PASSWORD': 'secret',
              'MYSQL_ROOT_PASSWORD': 'root'
        }
    },

    node: {
        name: 'node', 
        image: 'codemasonhq/node',
        type: 'instance',
    },
    
    ruby: {},
    postgres: {},
    redis: {},
}

/** 
 * Pre-packed application environments.
 */
var craftPacks = {
    laravel: "php, mysql",
    // meanjs: "nodejs, mongodb",
    // django: "python, nginx, postgres, redis"
}

/**
 * List of "aliases" for Docker images.
 */
var defaultDockerImages = {
    php: "codemasonhq/php:latest",
    nginx: "codemasonhq/nginx:latest",
    mysql: "mysql:latest",
}

/**
 * List of languages that will act as the base instance
 */
var languages = ["php", "ruby", "python"];

/**
 * List of adjectives to pick from in the success message 
 * ¯\_(ツ)_/¯ 
 */
var adjectives = ["amazing", "cool", "beautiful", "super", "sweet", "legendary", "exciting", "challenging"];


/**
 * Constructor for the `craft` command
 *
 * Use a pre-packed environment for your application. 
 * $ mason craft laravel
 * 
 * Specify services you will craft your application with.
 * $ mason craft --with="php, nginx, mysql"
 */
var craft = function(req, next, abort) {

    // $ mason craft laravel
    if(req.argv._[0]) {
        // Use a pre-packed environment for your application
        // I think these should be dynamically loaded, possibly as part of a plugin like system
        var services = craft.getServiceListFromPack(req.argv._[0]);
        
        // Update Mason JSON
        masonJson.name = req.argv._[0] + "-application";
        masonJson.description = "Application crafted with " + req.argv._[0];

        helpers.log();
        helpers.log("   Crafting " + req.argv._[0].green + " application with " + services.green);
        helpers.log();

    }

    // $ mason craft --with="..."
    if(req.argv.with) {
        var services = req.argv.with;

        // Update Mason JSON
        masonJson.name = "freestlye-application";
        masonJson.description = "Freestyle application crafted with " + services;
    
        helpers.log();
        helpers.log("   Crafting " + "blank".white + " application with " + services.green);
        helpers.log();
    }
    
    // At least one service must be used
    if(typeof services == "undefined") {
        abort("Cannot craft an application without any services");
    }

    // Parse services list 
    services = craft.parseServices(services);

    // Write files
    craft.compileDockerfile(req.argv.dockerfile) // Add Dockerfile to app
            .then(craft.compileDockerCompose.bind(null, req.argv.dockercompose)) // Add docker-compose.yml file to app
            .then(craft.compileGitLabCI.bind(null, req.argv.gitlab)) // Add .gitlab-ci.yml file to app
            .then(function() { // complete
                var adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
                helpers.log();
                helpers.log("   ✔ Build something ".green + adjective.green);
                helpers.log();
            });

}

/**
 * Parses the list of services so we can make
 * a few decisions about their project.
 */
craft.parseServices = function(servicesString) {

    // Convert any default services to their correct images
    var serviceArray = _.map(servicesString.split(","), _.trim);

    // Process the service list, match it with Mason JSON stubs
    var serviceList = _.pick(masonJsonStubs, serviceArray);

    // Warn the user about the usage of unsupported services
    if(serviceArray.length != _.size(serviceList)) {
        helpers.warning("Attempted to use an unsupported service - ignored.")
    }

    // Add instances to Mason JSON
    masonJson.instances = _.filter(serviceList, ['type', 'instance']);

    // Add services to Mason JSON
    masonJson.services = _.filter(serviceList, ['type', 'service']);

    // Send a warning if there is more than once instance
    if(masonJson.instances.length > 1) {
        // todo: add prompt to get them to choose(?)
        helpers.warning("More than one instance idenitifed. Manually intervention may be required." 
                        + "\n\n\t\t More info: " 
                        + "\n\t\t > This kind of thing usually occurs when there is more than one programming language " 
                        + "\n\t\t > being used. We use the programming language as the base for your Dockerfile." 
                        + "\n\t\t > When there are multiple languages, we don't know which to use as the base.")    
    }

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
    var context = context || _.get(masonJson, 'instances[0]', { image: 'ubuntu' });

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

    // Keep default identifiers if no context has been provided
    var defaultContext = {
        registry: '{{ registry }}',
        path: '{{ path }}'
    }

    // Replacement data for handlebars
    var context = context || defaultContext;

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
                        craft.confirmFileOverwrite(filename);
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
 * Return the list of services included
 * in a per-packed environment
 */
craft.getServiceListFromPack = function(pack) {
    return craftPacks.hasOwnProperty(pack) ? craftPacks[pack] : "";
}

module.exports = craft;
