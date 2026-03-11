const activityService = require('../services/activity.service');
const { updateUserPoints } = require('./leaderboard.controller');

// Points mapping for different activities
const ACTIVITY_POINTS = {
  'Recycling': 15,
  'Commute': 10,
  'Energy Usage': 12,
  'Water Consumption': 10,
  'Waste Reduction': 15,
  default: 5
};

async function create(req, res, io) {
  try {
    const { type, value, unit, user, userId } = req.body;
    
    if (!type || value == null) {
      return res.status(400).json({ error: 'type and value required' });
    }
    
    // Calculate points for this activity
    const pointsPerUnit = ACTIVITY_POINTS[type] || ACTIVITY_POINTS.default;
    const pointsEarned = Math.round(value * pointsPerUnit);
    
    // Create the activity
    const activity = await activityService.createActivity({ 
      type, 
      value, 
      unit, 
      user,
      userId 
    });
    
    // Update user points if userId is provided
    if (userId) {
      await updateUserPoints(userId, pointsEarned);
    }
    
    if (io) {
      io.emit('activityCreated', {
        ...activity.toObject(),
        points: pointsEarned
      });
    }
    
    return res.json({ 
      success: true, 
      activity,
      pointsEarned
    });
    
  } catch (err) {
    console.error('create activity error', err);
    return res.status(500).json({ error: 'server error' });
  }
}

async function getRecent(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 2000);
    const list = await activityService.getRecent(limit);
    res.json(list);
  } catch (err) {
    console.error('recent error', err);
    res.status(500).json({ error: 'server error' });
  }
}

async function summary(req, res) {
  try {
    const agg = await activityService.summaryByType();
    res.json(agg);
  } catch (err) {
    console.error('summary error', err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { create, getRecent, summary };