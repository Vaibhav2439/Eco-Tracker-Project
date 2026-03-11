const express = require('express');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const controller = require('../controllers/auth.controller');

const router = express.Router();

// Email/Password routes (your existing code)
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return controller.register(req, res);
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return controller.login(req, res);
  }
);

// ===== GOOGLE OAUTH ROUTES =====

// Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/auth.html?error=google_auth_failed' 
  }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET || 'dev_secret_change_me', 
      { expiresIn: '7d' }
    );
    
    // Prepare user data (exclude sensitive info)
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      points: req.user.points,
      avatar: req.user.avatar,
      authProvider: req.user.authProvider
    };
    
    // Redirect to frontend with token
    res.redirect(`/auth.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  }
);

// Optional: Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;