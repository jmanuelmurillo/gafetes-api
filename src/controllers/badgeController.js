const badgeService = require('../services/badgeService');
var fs = require('fs');

const buildNewBadge = async (req, res) => {
	const { body } = req;

	if(!body.badges || !body.participantTokens){
		res.status(400);
	}
	else{
		const fileCreated = await badgeService.buildNewBadge(body.badges, body.participantTokens);
		res.contentType("application/pdf");
		var data = fileCreated.split(',')[1];
		var buf = Buffer.from(data,'base64');
		res.send(buf);
	}
}


module.exports = {
	buildNewBadge
}