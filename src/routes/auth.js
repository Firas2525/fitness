const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const validate = require('../middleware/validate');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number');

// POST /api/auth/register
router.post('/register',
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  passwordRules,
  validate,
  ctrl.register
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  ctrl.login
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  ctrl.requestPasswordReset
);

// POST /api/auth/reset-password
router.post('/reset-password',
  body('token').notEmpty().withMessage('Token is required'),
  body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  ctrl.resetPassword
);

module.exports = router;
