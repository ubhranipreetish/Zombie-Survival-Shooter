const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// @route   POST /api/auth/signup
// @desc    Register a new user with email & password
// @access  Public
router.post('/signup', authController.signup);

// @route   POST /api/auth/login
// @desc    Authenticate user & get JWT token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/google
// @desc    Start Google OAuth2 flow
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth2 callback — redirects to frontend with JWT
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login?error=google_failed' }),
  authController.googleCallback
);

module.exports = router;
