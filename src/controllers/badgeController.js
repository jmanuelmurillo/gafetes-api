const badgeService = require('../services/badgeService');
var fs = require('fs');

const root = async (req, res) => {
	const { body } = req;
	res.send('Hello world!');
}

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

const hello = async (req, res) => {
	console.log("enter here");
	const { body } = req;

	if(!body.data){
		res.status(400);
		res.send("No data entered");
	}
	else{
		res.send(body.data);
	}
}

const image = async (req, res) => {
	console.log("enter image");

	const result = await badgeService.buildImage();
	res.send(result);

}

module.exports = {
	root,
	buildNewBadge,
	hello,
	image
}