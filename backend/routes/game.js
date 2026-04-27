const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated (using session)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // Also check if user ID is in headers (for testing or non-session clients)
  if (req.headers['x-user-id']) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Save game progress
router.put('/progress', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    const { progress } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { gameProgress: { ...progress, hasProgress: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Progress saved', progress: user.gameProgress });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get game progress
router.get('/progress', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ progress: user.gameProgress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear game progress
router.delete('/progress', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    const user = await User.findByIdAndUpdate(
      userId,
      { 'gameProgress.hasProgress': false },
      { new: true }
    );

    res.json({ message: 'Progress cleared' });
  } catch (error) {
    console.error('Error clearing progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
