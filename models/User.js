const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // Made optional for Google users
  googleId: { type: String, unique: true, sparse: true }, // Add googleId field
  avatar: { type: String }, // Add avatar for Google profile picture
  authProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  points: { type: Number, default: 0 }
}, { timestamps: true });

// ensure email index
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);