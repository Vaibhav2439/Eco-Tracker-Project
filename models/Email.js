const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure email index
EmailSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Email', EmailSchema);
