const Activity = require('../models/Activity.model');

async function createActivity(payload) {
  try {
    console.log('🔍 Creating activity with payload:', payload);
    
    // Ensure required fields
    if (!payload.type || !payload.value) {
      throw new Error('type and value are required');
    }
    
    const activity = new Activity({
      type: payload.type,
      value: payload.value,
      unit: payload.unit || '',
      user: payload.user || 'You',
      userId: payload.userId,
      points: payload.points || 0,
      co2Saved: payload.co2Saved || 0,
      createdAt: new Date()
    });
    
    console.log('💾 Saving activity to MongoDB...');
    const saved = await activity.save();
    console.log('✨ Activity successfully saved:', saved);
    
    return saved;
  } catch (err) {
    console.error('💥 Error saving activity:', err.message || err);
    throw err;
  }
}

async function getRecent(limit = 20) {
  return Activity.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getUserActivities(userId) {
  return Activity.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

async function summaryByType() {
  return Activity.aggregate([
    { $group: { 
      _id: "$type", 
      total: { $sum: "$value" }, 
      count: { $sum: 1 },
      totalPoints: { $sum: "$points" },
      totalCO2: { $sum: "$co2Saved" }
    } }
  ]);
}

module.exports = { 
  createActivity, 
  getRecent, 
  getUserActivities,
  summaryByType 
};