const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

router.get('/', badgeController.root);

router.post('/', badgeController.root);

router.post('/hello', badgeController.hello);

router.post('/build', badgeController.buildNewBadge);

module.exports = router;
