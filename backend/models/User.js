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
    // Google ID is optional, only present for users who sign in via Google
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
