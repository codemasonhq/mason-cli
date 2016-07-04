var storage = require('node-persist');
var helpers = require("../util/helpers");

storage.initSync(helpers.initSyncOptions);

var whoami = function(req, next, abort) {
    
    var user = storage.getItem('user');

    if(user != undefined) {
        helpers.log("\n   You are currently logged in: \n");
        helpers.log("          Name: " + user.name),
        helpers.log("         Email: " + user.email);
        helpers.log("");    
    } else {
        helpers.log("\n   Not logged in. \n");
    }
    
}

module.exports = whoami;
