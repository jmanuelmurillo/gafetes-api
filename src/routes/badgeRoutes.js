const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router
	.post('/', badgeController.root)

	.post('/build', badgeController.buildNewBadge)

	.post('/hello', badgeController.hello)
	
	.post('/log', badgeController.log)

module.exports = router;
	