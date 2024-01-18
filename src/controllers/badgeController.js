const badgeService = require('../services/badgeService');
var fs = require('fs');

const root = async (req, res) => {
	console.log("enter root");
	res.send('Hello world!');
}

const buildNewBadge = async (req, res) => {
	console.log("enter buildNewBadge");

	const { body } = req;

	if (!body.badges || !body.participantTokens) {
		res.status(400);
	}
	else {
		const fileCreatedUrl = await badgeService.buildNewBadge(body.badges, body.participantTokens);
		/*res.contentType("application/pdf");
		var data = fileCreated.split(',')[1];
		var buf = Buffer.from(data,'base64');*/
		res.send(fileCreatedUrl);
	}
}

const hello = async (req, res) => {
	console.log("enter hello");
	const { body } = req;

	if (!body) {
		res.status(400);
		res.send("No data entered");
	}
	else {
		res.send(body);
	}
}

module.exports = {
	root,
	buildNewBadge,
	hello
}