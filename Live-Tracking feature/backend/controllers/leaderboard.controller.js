// backend/controllers/leaderboard.controller.js

const User = require('../models/User.model');

async function getLeaderboard(req, res) {
  try {
    const list = await User.find({})
      .sort({ points: -1 })
      .lean()
      .exec();

    // Always return an array
    return res.json(Array.isArray(list) ? list : []);
  } catch (err) {
    console.error("leaderboard error:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}

module.exports = { getLeaderboard };
