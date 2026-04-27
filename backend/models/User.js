const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    // Password is not required if the user signs in with Google
    required: function() {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
  },
  gameProgress: {
    wave: { type: Number, default: 1 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    collectedCards: { type: Array, default: [] },
    ammo: { type: Object, default: {} },
    stats: { type: Object, default: {} },
    hasProgress: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
