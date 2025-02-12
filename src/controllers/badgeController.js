const badgeService = require('../services/badgeService');
var fs = require('fs');

const root = async (req, res) => {
	console.log("enter root");
	res.send('Hello world!');
}

const buildNewBadge = async (req, res) => {
	console.log("enter build badge");

	const { body } = req;

	if (!body.badges || !body.participantTokens) {
		res.status(400);
		res.send({"error": "404 Bad request"})
	}
	else {
		const upload = body.upload && body.upload == true;
		const eventId = (body.eventId && body.eventId != '') ? body.eventId : '0';
		const participantId = (body.participantId && body.participantId != '') ? body.participantId : '0';
		const environment = (body.environment && body.environment != '') ? body.environment : 'Stage';

		const result = await badgeService.buildNewBadge(body.badges, body.participantTokens, upload, eventId, participantId, environment);
		
		if(!upload){
			res.contentType("application/pdf");
		}
		res.send(result);
	}
	console.log("finish build badge");
}

module.exports = {
	root,
	buildNewBadge
}