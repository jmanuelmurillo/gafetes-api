const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router.post('/', badgeController.root);

router.post('/build', badgeController.buildNewBadge);

router.post('/hello', badgeController.hello);

router.post('/image', badgeController.image);

module.exports = router;
	