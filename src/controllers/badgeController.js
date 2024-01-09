const badgeService = require('../services/badgeService');
var fs = require('fs');

const getAllBadges = (req, res) => {
	const AllBadges = badgeService.getAllBadges();
	res.send(`Get all badges`);
}

const getOneBadge = (req, res) => {
	const badgeRoutesadge = badgeService.getOneBadge();
	res.send(`Get badge ${req.params.badgeID}`);
}

const createNewBadge = (req, res) => {
	const createdBadge = badgeService.buildNewBadge();
	res.send(`Create badge ${req.params.badgeID}`);
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
		//fs.writeFileSync('./secondDemo.pdf', buf);

		// var buffer = Buffer.from([fileCreated],'base64');
		// fs.writeFileSync('./secondDemo.pdf', buffer);
		//res.download("hla.pdf", fileCreated);
		//res.send('ok');
	}
	
}

const updateOneBadge = (req, res) => {
	const updatedBadged = badgeService.updateOneBadge();
	res.send(`Update badge ${req.params.badgeID}`);
}

const deleteOneBadge = (req, res) => {
	badgeService.deleteOneBadge();
	res.send(`Delete badge ${req.params.badgeID}`);
}

module.exports = {
	getOneBadge, 
	getAllBadges, 
	createNewBadge, 
	buildNewBadge,
	updateOneBadge, 
	deleteOneBadge
}