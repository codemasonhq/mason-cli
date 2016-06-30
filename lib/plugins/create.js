var namor = require('namor');
var request = require("request");
var storage = require('node-persist');
var helpers = require("../util/helpers");

storage.initSync();

var create = function(req, next, abort) {

	var token = storage.getItem('token');
	var name = namor.generate();

	helpers.log("");
	helpers.log("   Creating application on Codemason...".white);
	helpers.log("");
	helpers.log("      Application name [" + name.yellow + "]: ");
	helpers.log("      Application path [" + "/Users/ben/Documents/git/DockerExperiment/blank".yellow + "]: ");
	helpers.log("                Domain [" + name.yellow + ".mason.ci".yellow + "]: pebble.mason.ci");
	helpers.log("");
	helpers.log("   ✔ Created application".green);
	helpers.log("   ✔ Created remote repository".green);
	helpers.log("   ✔ Added git remote codemason".green);
	helpers.log("");

}

module.exports = create;
