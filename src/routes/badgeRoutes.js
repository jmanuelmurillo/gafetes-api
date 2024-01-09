const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router
	.get('/', badgeController.getAllBadges)

	.get('/:badgeId', badgeController.getOneBadge)

	//.post('/:badgeId', badgeController.createNewBadge)

	.post('/', badgeController.buildNewBadge)

	.patch('/:badgeId', badgeController.updateOneBadge)

	.delete('/:badgeId', badgeController.deleteOneBadge)


module.exports = router;
	