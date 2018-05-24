const {helpers} = require('../../util/helpers');
const {Command} = require('@oclif/command')
const axios = require('axios');

class AppsIndex extends Command {
  async run() {

  	// axios.get('http://localhost/v1/codemason/applications?api_token=xzmr8HM6FEmz6YGD8PSwUsBTwocM1jQ6wk6sPLm0xPIEiaXAwfHerNqpdfnk')
  	// 	.then((response) => {
  	// 		console.log(response.data);
  	// 	});

  }
}

AppsIndex.description = 'list your apps'

module.exports = AppsIndex