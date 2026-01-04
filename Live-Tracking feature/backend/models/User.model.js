const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 }
}, { timestamps: true });

// ensure email index
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);