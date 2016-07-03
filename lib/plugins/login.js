var fs = require("fs");
var path = require("path");
var request = require("request");
var child = require('child_process');
var storage = require('node-persist');
var helpers = require("../util/helpers");
var os = require("os");
var hostname = os.hostname();

storage.initSync(helpers.initSyncOptions);

var loginUrl = "http://localhost:8080/";
var sshKeyPath = helpers.getUserHome() + "/.ssh/id_rsa";

var login = function(req, next, abort) {

	helpers.log("\n   Please login or create an account by entering an email and password: \n");
	helpers.log("          Site: " + loginUrl.green);

	login.requestCredentials(req)
			.then(login.authenticate)
			.then(login.uploadKey);

}

/**
 * Request login credentials from user
 */
login.requestCredentials = function(req) {
	return new Promise(function(resolve, reject) {
		req.read({ // request their email first
			prompt: helpers.INVISIBLE_CHARACTER + "        Email: ",
		}, function(err, email) {
			req.read({ // then their password
				prompt: helpers.INVISIBLE_CHARACTER + "     Password: ",
				silent: true,
				replace: "*",
			}, function(err, password) { // fulfil promise 
				resolve({
					email: email,
					password: password,
				})
			});
		});
	});
}

/**
 * Authenticate the user and store get a JWT token
 */
login.authenticate = function(credentials) {

	// Login, get access token and store it.
	request.post({
		url: 'http://localhost:8080/v1/token',
		json: true,
		form: { 
			email: credentials.email,
			password: credentials.password,
			token_name: "Mason CLI - " + os.hostname().split('.').shift(),
		}
	}, function(error, response, body) {

		if(error || body.errors != undefined) {
			helpers.log("   ✗ Login failed".red);
			helpers.log();
			return;
		}

		helpers.log("   ✔ Login successful".green);
		helpers.log();

		storage.setItem('token', body.token);
		storage.setItem('user', body.user);

	});
	
}

/** 
 * Upload the public SSH key
 */
login.uploadKey = function() {

	// TODO: Fix this so it works on Windows too(?)
	function generateKey() {
		child.execSync("ssh-keygen -t rsa -f " + sshKeyPath + " -q -N ''");
		return getKey();
	}

	// Get the ssh key 
	function getKey() {
		if(helpers.fileExists(sshKeyPath + '.pub')) {
			return child.execSync('cat ' + sshKeyPath + '.pub', {stdio: 'pipe'});
		} else {
			return false;
		}
	}

	var key = getKey();
	if(key == false) {
		helpers.log("   ⬩ Could not find an existing public key".yellow);
		helpers.log("     ↪ Generating new SSH public key")
		helpers.log();

		// Generate key 
		key = generateKey();
	}

	// Upload key
	request.post({
		url: 'http://localhost:8080/v1/git/keys',
		json: true,
		form: { 
			api_token: storage.getItem('token'),
			title: os.hostname(),
			key: key
		}
	}, function(error, response, body) {

		if(error || body.errors != undefined) {

			// Don't alert the user if the key has already been added
			if(body.errors[0].message.indexOf('fingerprint') == -1) {
				helpers.log("   ✗ Could not upload public SSH key".red);
				helpers.log();
				return;	
			}

		}

		// Success!

	});

}

module.exports = login;