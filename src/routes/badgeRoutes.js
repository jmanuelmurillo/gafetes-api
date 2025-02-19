const express = require('express');
const router = express.Router();
const BadgeController = require('../controllers/badgeController');

router.get('/', BadgeController.root);

router.post('/', BadgeController.root);

router.post('/build', BadgeController.buildNewBadge);

module.exports = router;
