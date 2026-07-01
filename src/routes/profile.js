const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/profileController');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

const profileValidation = [
  body('age').optional().isInt({ min: 5, max: 120 }).withMessage('Age must be between 5 and 120'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('height_cm').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weight_kg').optional().isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
  body('activity_level').optional().isIn([
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
  ]).withMessage('Invalid activity level'),
  body('goal').optional().isIn([
    'weight_loss', 'muscle_gain', 'general_fitness'
  ]).withMessage('Goal must be weight_loss, muscle_gain, or general_fitness'),
];

// All profile routes require authentication
router.use(auth);

// GET  /api/profile
router.get('/',     ctrl.getProfile);

// POST /api/profile
router.post('/',
  body('gender').notEmpty().isIn(['male', 'female']).withMessage('Gender is required'),
  profileValidation,
  validate,
  ctrl.createProfile
);

// PUT  /api/profile
router.put('/',  profileValidation, validate, ctrl.updateProfile);

// GET  /api/profile/stats  — returns BMI, BMR, TDEE
router.get('/stats', ctrl.getStats);

module.exports = router;
