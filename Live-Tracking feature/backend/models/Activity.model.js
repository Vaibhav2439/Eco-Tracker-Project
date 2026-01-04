const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: { type: String, required: true },     // e.g., Commute
  value: { type: Number, required: true },    // numeric
  unit: { type: String, default: '' },        // km, kWh, L, items, kg
  user: { type: String, default: 'You' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);