const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auth.controller');

const router = express.Router();

// Sign up
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
  ],
  controller.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  controller.login
);

// Google Auth - Step 1 (Redirect to Google)
router.get('/google', controller.googleAuth);

// Google Auth - Step 2 (Callback from Google)
router.get('/google/callback', controller.googleCallback);

module.exports = router;