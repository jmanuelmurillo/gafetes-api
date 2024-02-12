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
		const upload = body.upload && body.upload == true;
		const eventName = (body.eventName && body.eventName != '') ? body.eventName : 'defaultEvent';
		const userIdentifier = (body.userIdentifier && body.userIdentifier != '') ? body.userIdentifier : 'stage';

		const result = await badgeService.buildNewBadge(body.badges, body.participantTokens, upload, eventName, userIdentifier);
		
		if(!upload){
			res.contentType("application/pdf");
		}
		res.send(result);
	}
}

module.exports = {
	root,
	buildNewBadge
}