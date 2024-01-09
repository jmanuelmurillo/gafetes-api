const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router
	.post('/', badgeController.buildNewBadge)

module.exports = router;
	