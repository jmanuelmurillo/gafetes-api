const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router
	.post('/', badgeController.root)

	.post('/build', badgeController.buildNewBadge)

	.post('/hello', badgeController.hello)

module.exports = router;
	