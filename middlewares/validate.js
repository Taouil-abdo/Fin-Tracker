const { body, validationResult } = require('express-validator');

// Validate the request body
const validateRegister = [
  body('fullname').isLength({ min: 3 }).withMessage('Full name should be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('sexe').isIn(['male', 'female', 'other']).withMessage('Sexe must be "male", "female", or "other"'),
  body('age').isInt({ min: 18 }).withMessage('Age must be at least 18'),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = validateRegister;
