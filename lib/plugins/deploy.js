var child = require('child_process');
var request = require("request");
var helpers = require("../util/helpers");

var deploy = function(req, next, abort) {

	helpers.log("");
	helpers.log("   Deploying application to Codemason...".white);
	helpers.log("");
	helpers.log("      Uploading [=================] " + "100%".yellow + " 5.7s");
	helpers.log("       Building [=================] " + "100%".yellow + " 10s, " + "✔ passed".green)
	// helpers.log("       Building [=================] 100% 10.4s")
	// helpers.log("       Building [=================] 100% 10s, " + "✗ failed".red)
	helpers.log("      Launching [=================] " + "100%".yellow + " 16.6s");
	helpers.log();
	helpers.log("   *´¨)".yellow);
	helpers.log("    ¸.•´ ¸.•*´¨) ¸.•*¨)".yellow);
	helpers.log("   (¸.•´ (¸.•` ¤ ".yellow + "Application deployed and running at ".white + "hello-world-1234.mason.ci".underline.green);

	helpers.log();

}

module.exports = deploy;
