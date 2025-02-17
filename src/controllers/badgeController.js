const badgeService = require('../services/badgeService');
var fs = require('fs');

const root = async (req, res) => {
    try {
        console.log("enter root");
        res.send('Hello world!');
    } catch (error) {
        console.error('Error in root:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

const buildNewBadge = async (req, res) => {
    try {
        console.log('\x1b[34m%s\x1b[0m', '=> Start build badge');

        const { body } = req;

        if (!body.badges || !body.participantTokens) {
            res.status(400).send({ error: "400 Bad Request" });
        } else {
            const upload = body.upload && body.upload == true;
            const eventId = (body.eventId && body.eventId != '') ? body.eventId : '0';
            const participantId = (body.participantId && body.participantId != '') ? body.participantId : '0';
            const environment = (body.environment && body.environment != '') ? body.environment : 'Stage';

            const result = await badgeService.buildNewBadge(body.badges, body.participantTokens, upload, eventId, participantId, environment);
			console.log('Result: ', result);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', '*');
            res.send(result);
        }
        console.log('\x1b[32m%s\x1b[0m', '=> Finish build badge');
    } catch (error) {
        console.error('Error in buildNewBadge:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

module.exports = {
	root,
	buildNewBadge
}