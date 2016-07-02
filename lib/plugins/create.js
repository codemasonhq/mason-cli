var path = require("path");
var read = require("read");
var namor = require("namor");
var request = require("request");
var storage = require("node-persist");
var helpers = require("../util/helpers");

storage.initSync();

var applicationName = namor.generate();
var applicationPath = process.cwd();
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
			applicationName = response;
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
			applicationPath = response;
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
			applicationDomain = response;
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
			url: 'http://localhost:8080/v1/repositories?api_token=' + token,
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
			resolve();

		});
	});

}

create.createGitRemote = function() {

	return new Promise(function(resolve, reject) {
		helpers.log("   ✔ Added git remote codemason".green);
		resolve();
	});

}

module.exports = create;
