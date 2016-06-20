var fs = require('fs-extra');
var helpers = require("../util/helpers")

/**
 * We use Mason JSON internally just make it a 
 * little bit easier dealing with all the 
 * Docker configruation options.
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
		name: "php", 
	},

	node: {

	},

	ruby: {

	},

	nginx: {

	},

	mysql: {

	},

	postgres: {

	},

	redis: {

	},
}


/** 
 * Pre-packed application environments.
 */
var craftPacks = {
	laravel: "php, nginx, mysql",
	meanjs: "nodejs, mongodb",
	django: "python, nginx, postgres, redis"
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
    // craft.compileDockerCompose();

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
	var serviceArray = servicesString.split(",");

	// Parse the service list 
	serviceArray.forEach(function(service) {
		service = service.trim();

		if(languages.indexOf(service) > -1) { // Add instance
			masonJson.instances.push({
				name: service,
				image: defaultDockerImages.hasOwnProperty(service) ? defaultDockerImages[service] : service
			})
		} else { // Add services
			masonJson.services.push({
				name: service, 
				image: defaultDockerImages.hasOwnProperty(service) ? defaultDockerImages[service] : service,
			})
		}
	})

	console.log(masonJson);
}

/**
 * Compile `Dockerfile` and add to app source
 */ 
craft.compileDockerfile = function() {

	// Get Dockerfile template
	var source = craft.getTemplateFile("./stubs/Dockerfile");

	// Prep the handlebars template
	// var template = Handlebars.compile(source);

	// Replacement data for handlebars
	// var data = {
		// image: "codemasonhq/php",
	// }

	// var result = template(data);

}

/**
 * Compile `docker-compose.yml` and add to app source
 */
craft.compileDockerCompose = function() {
	var template = craft.getTemplateFile("./stubs/docker-compose.yml");
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
