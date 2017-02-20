var storage = require('node-persist');
var helpers = require("../util/helpers");

storage.initSync(helpers.initSyncOptions);

/**
 * Display the users API token
 */
var token = function(req, next, abort) {
    
    var token = storage.getItem('token');

    if(token != undefined) {
        helpers.log("\n   You API token: \n".green);
        helpers.log("         " + token),
        helpers.log("");    
    } else {
        helpers.log("\n   Not logged in. \n");
    }
    
}

module.exports = token;
