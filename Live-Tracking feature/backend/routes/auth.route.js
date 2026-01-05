const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auth.controller');

const router = express.Router();

//Sign up Page//

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowewrcase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one Uppercase letter')
  ],
  controller.register
);

//Login Page//

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  controller.login
);

module.exports = router;
