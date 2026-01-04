const Activity = require('../models/Activity.model');

async function createActivity(payload) {
  try {
    console.log('🔍 Creating activity with payload:', payload);
    const a = new Activity(payload);
    console.log('💾 Saving activity to MongoDB...');
    const saved = await a.save();
    console.log('✨ Activity successfully saved:', saved);
    return saved;
  } catch (err) {
    console.error('💥 Error saving activity:', err.message || err);
    throw err;
  }
}

async function getRecent(limit = 200) {
  return Activity.find({}).sort({ createdAt: -1 }).limit(limit);
}

async function summaryByType() {
  return Activity.aggregate([
    { $group: { _id: "$type", total: { $sum: "$value" }, count: { $sum: 1 } } }
  ]);
}

module.exports = { createActivity, getRecent, summaryByType };