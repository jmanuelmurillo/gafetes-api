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
		res.send({"error": "404 Bad request"})
	}
	else {
		const result = await badgeService.buildNewBadge(body.badges, body.participantTokens);
		res.send(result);
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