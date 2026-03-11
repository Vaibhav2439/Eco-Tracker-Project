// backend/routes/leaderboard.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/leaderboard.controller'); // Ensure correct import

// /api/leaderboard → returns array
router.get('/', controller.getLeaderboard);

module.exports = router;
