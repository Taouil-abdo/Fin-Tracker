const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

const userValidation = {
    register: [
        body('fullname')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Full name can only contain letters and spaces'),
        
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
        
        body('sexe')
            .isIn(['male', 'female', 'other'])
            .withMessage('Gender must be male, female, or other'),
        
        body('age')
            .isInt({ min: 18, max: 120 })
            .withMessage('Age must be between 18 and 120'),
        
        handleValidationErrors
    ],

    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        
        handleValidationErrors
    ],

    updateProfile: [
        body('fullname')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        
        body('sexe')
            .optional()
            .isIn(['male', 'female', 'other'])
            .withMessage('Gender must be male, female, or other'),
        
        body('age')
            .optional()
            .isInt({ min: 18, max: 120 })
            .withMessage('Age must be between 18 and 120'),
        
        handleValidationErrors
    ]
};

const transactionValidation = {
    create: [
        body('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be greater than 0'),
        
        body('description')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Description must be between 1 and 255 characters'),
        
        body('type')
            .isIn(['income', 'expense'])
            .withMessage('Type must be either income or expense'),
        
        body('date')
            .isISO8601()
            .withMessage('Please provide a valid date'),
        
        body('categoryId')
            .isInt({ min: 1 })
            .withMessage('Please provide a valid category ID'),
        
        body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notes cannot exceed 1000 characters'),
        
        handleValidationErrors
    ],

    update: [
        body('amount')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be greater than 0'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Description must be between 1 and 255 characters'),
        
        body('type')
            .optional()
            .isIn(['income', 'expense'])
            .withMessage('Type must be either income or expense'),
        
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid date'),
        
        body('categoryId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Please provide a valid category ID'),
        
        body('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notes cannot exceed 1000 characters'),
        
        handleValidationErrors
    ]
};

const categoryValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Category name must be between 2 and 100 characters'),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        body('type')
            .isIn(['income', 'expense'])
            .withMessage('Type must be either income or expense'),
        
        body('color')
            .optional()
            .matches(/^#[0-9A-F]{6}$/i)
            .withMessage('Color must be a valid hex color code'),
        
        handleValidationErrors
    ],

    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Category name must be between 2 and 100 characters'),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        body('type')
            .optional()
            .isIn(['income', 'expense'])
            .withMessage('Type must be either income or expense'),
        
        body('color')
            .optional()
            .matches(/^#[0-9A-F]{6}$/i)
            .withMessage('Color must be a valid hex color code'),
        
        handleValidationErrors
    ]
};

const budgetValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Budget name must be between 2 and 100 characters'),
        
        body('amount')
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be greater than 0'),
        
        body('startDate')
            .isISO8601()
            .withMessage('Please provide a valid start date'),
        
        body('endDate')
            .isISO8601()
            .withMessage('Please provide a valid end date')
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        handleValidationErrors
    ],

    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Budget name must be between 2 and 100 characters'),
        
        body('amount')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Amount must be greater than 0'),
        
        body('startDate')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid start date'),
        
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid end date'),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        body('status')
            .optional()
            .isIn(['active', 'completed', 'exceeded', 'paused'])
            .withMessage('Status must be active, completed, exceeded, or paused'),
        
        handleValidationErrors
    ]
};

const goalValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Goal name must be between 2 and 100 characters'),
        
        body('targetAmount')
            .isFloat({ min: 0.01 })
            .withMessage('Target amount must be greater than 0'),
        
        body('targetDate')
            .isISO8601()
            .withMessage('Please provide a valid target date')
            .custom((value) => {
                if (new Date(value) <= new Date()) {
                    throw new Error('Target date must be in the future');
                }
                return true;
            }),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high'])
            .withMessage('Priority must be low, medium, or high'),
        
        handleValidationErrors
    ],

    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Goal name must be between 2 and 100 characters'),
        
        body('targetAmount')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Target amount must be greater than 0'),
        
        body('currentAmount')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Current amount must be 0 or greater'),
        
        body('targetDate')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid target date'),
        
        body('description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        
        body('status')
            .optional()
            .isIn(['active', 'completed', 'paused', 'cancelled'])
            .withMessage('Status must be active, completed, paused, or cancelled'),
        
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high'])
            .withMessage('Priority must be low, medium, or high'),
        
        handleValidationErrors
    ]
};

module.exports = {
    userValidation,
    transactionValidation,
    categoryValidation,
    budgetValidation,
    goalValidation,
    handleValidationErrors
};