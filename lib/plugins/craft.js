var fs = require('fs-extra');
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
		},
	},

	nginx: {
		name: 'nginx',
		image: 'codemasonhq/nginx',
		type: 'service',
        volumes: {
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

	node: {},
	ruby: {},
	postgres: {},
	redis: {},
}


/** 
 * Pre-packed application environments.
 */
var craftPacks = {
	laravel: "php, nginx, mysql",
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

		helpers.log("Crafting " + req.argv._[0].green + " application with " + services.green);
	}

	// $ mason craft --with="..."
	if(req.argv.with) {
		var services = req.argv.with;

		// Update Mason JSON
		masonJson.name = "freestlye-application";
		masonJson.description = "Freestyle application crafted with " + services;

		helpers.log("Crafting " + "blank".white + " application with " + services.green);
	}
    
    // At least one service must be used
    if(typeof services == "undefined") {
    	abort("Cannot craft an application without any services");
    }

    // Parse services list 
    services = craft.parseServices(services);

    // Add Dockerfile to app
    craft.compileDockerfile();

    // Add docker-compose.yml file to app
    craft.compileDockerCompose();

    // Add .gitlab-ci.yml file to app
    // craft.compileGitLabCI();

    process.exit();

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
		helpers.warning("More than one instance idenitifed. Manually intervention will may be required." 
						+ "\n\n\t\t More info: " 
						+ "\n\t\t > This kind of thing usually occurs when there is more than one programming language " 
						+ "\n\t\t > being used. We use the programming language as the base for your Dockerfile." 
						+ "\n\t\t > When there are multiple languages, we don't know which to use as the base.")	
	}

}

/**
 * Compile `Dockerfile` and add to app source
 */ 
craft.compileDockerfile = function() {

	// Get Dockerfile template
	var source = craft.getTemplateFile("./stubs/Dockerfile");

	// Prep the handlebars template
	var template = Handlebars.compile(source);

	// Replacement data for handlebars
	var data = _.get(masonJson, 'instances[0]', { image: 'ubuntu' });

	// Compile
	var result = template(data);

	console.log(result);
}

/**
 * Compile `docker-compose.yml` and add to app source
 */
craft.compileDockerCompose = function() {
	
	// Get Dockerfile template
	var source = craft.getTemplateFile("./stubs/docker-compose.yml");

	// Prep the handlebars template
	var template = Handlebars.compile(source);

	// Replacement data for handlebars
	var data = masonJson;

	// Compile
	var result = template(data);

	console.log(result);
}

/**
 * Compile `.gitlab-ci.yml` and add to app source
 */
craft.compileGitLabCI = function() {
	var template = craft.getTemplateFile("./stubs/.gitlab-ci.yml");
}

/**
 * Grab template file 
 */
craft.getTemplateFile = function(templateFile) {
	try {
		return fs.readFileSync(templateFile, 'utf8');
	} catch (error) {
		helpers.abort("Error: there was a problem reading template");
	}
}

/**
 * Return the list of services included
 * in a per-packed environment
 */
craft.getServiceListFromPack = function(pack) {
	return craftPacks.hasOwnProperty(pack) ? craftPacks[pack] : "";
}

module.exports = craft;
