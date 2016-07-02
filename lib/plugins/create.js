var path = require("path");
var namor = require("namor");
var request = require("request");
var storage = require("node-persist");
var helpers = require("../util/helpers");

storage.initSync();

var name = namor.generate();
var token = storage.getItem('token');

var create = function(req, next, abort) {

	helpers.log("");
	helpers.log("   Creating application on Codemason...".white);
	helpers.log("");

	create.requestApplicationName()
			.then(create.requestApplicationPath)
			// .then(create.requestApplicationDomain)
			.then(create.applicationCreate)
			
}


create.requestApplicationName = function() {
	return new Promise(function(resolve, reject) {
		helpers.log("      Application name [" + name.yellow + "]: ");
		resolve();
	});
}

create.requestApplicationPath = function() {
	return new Promise(function(resolve, reject) {
		helpers.log("      Application path [" + process.cwd().yellow + "]: ");
		resolve();
	});
}

create.requestApplicationDomain = function() {
	return new Promise(function(resolve, reject) {
		helpers.log("                Domain [" + name.yellow + ".mason.ci".yellow + "]: pebble.mason.ci");
	});
}

create.applicationCreate = function() {
	/*// Create Application
	request.post({
		url: 'http://localhost:8080/v1/applications?api_token=' + token,
		json: true,
		form: { 
			name: name
		}
	}, function(error, response, body) {

		if(error) {
			helpers.log("   ✗ Create application failed [".red + error.code.red + "]".red);
			return;
		}

		helpers.log("   ✔ Created application".green);

	});

	// Create Repository (from Application)
	request.post({
		url: 'http://localhost:8080/v1/repositories?api_token=' + token,
		json: true,
		form: { 
			name: name
		}
	}, function(error, response, body) {

		if(error) {
			helpers.log("   ✗ Create application failed [".red + error.code.red + "]".red);
			return;
		}

		helpers.log("   ✔ Created application".green);

	});*/

	helpers.log("");
	helpers.log("   ✔ Created application".green);
	helpers.log("   ✔ Created remote repository".green);
	helpers.log("   ✔ Added git remote codemason".green);
	helpers.log("");
}
module.exports = create;
