const { body, param, validationResult } = require('express-validator');

// ============================================================
// INPUT VALIDATOR MIDDLEWARE
// Centralized request validation using express-validator.
//
// OWASP A03:2021 — Injection Prevention
// DPDP Act — Data Minimization (reject malformed data early)
// ============================================================

/**
 * Middleware that checks validation results and returns
 * 400 with structured errors if any validation fails.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            errors: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

/**
 * Login validation: email format + password presence
 */
const validateLogin = [
    body('email')
        .isEmail().withMessage('A valid email address is required.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .isString().withMessage('Password must be a string.'),
    handleValidationErrors
];

/**
 * Registration validation: stricter checks
 */
const validateRegister = [
    body('name')
        .notEmpty().withMessage('Name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.')
        .trim()
        .escape(),
    body('email')
        .isEmail().withMessage('A valid email address is required.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain at least one number.')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character.'),
    body('role')
        .optional()
        .isIn(['Student', 'Faculty', 'Admin']).withMessage('Role must be Student, Faculty, or Admin.'),
    handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required for verification.'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
        .matches(/[0-9]/).withMessage('New password must contain at least one number.')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('New password must contain at least one special character.'),
    handleValidationErrors
];

/**
 * Feedback submission validation
 */
const validateFeedback = [
    body('courseId')
        .notEmpty().withMessage('courseId is required.')
        .isMongoId().withMessage('courseId must be a valid ID.'),
    body('facultyId')
        .notEmpty().withMessage('facultyId is required.')
        .isMongoId().withMessage('facultyId must be a valid ID.'),
    body('ratings')
        .isArray({ min: 1 }).withMessage('ratings must be a non-empty array.'),
    body('ratings.*.questionId')
        .isMongoId().withMessage('Each rating must have a valid questionId.'),
    body('ratings.*.score')
        .isInt({ min: 1, max: 10 }).withMessage('Each score must be an integer between 1 and 10.'),
    body('remark')
        .optional()
        .isString().withMessage('Remark must be a string.')
        .isLength({ max: 2000 }).withMessage('Remark cannot exceed 2000 characters.')
        .trim(),
    handleValidationErrors
];

/**
 * OTP request validation
 */
const validateOTPRequest = [
    body('phone')
        .notEmpty().withMessage('Phone number is required.')
        .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits.'),
    handleValidationErrors
];

/**
 * OTP verify validation
 */
const validateOTPVerify = [
    body('phone')
        .notEmpty().withMessage('Phone number is required.')
        .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits.'),
    body('otp')
        .notEmpty().withMessage('OTP is required.')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
        .isNumeric().withMessage('OTP must contain only digits.'),
    handleValidationErrors
];

/**
 * MongoDB ObjectId param validation
 */
const validateObjectIdParam = (paramName) => [
    param(paramName)
        .isMongoId().withMessage(`${paramName} must be a valid MongoDB ObjectId.`),
    handleValidationErrors
];

/**
 * Consent validation
 */
const validateConsent = [
    body('consentType')
        .notEmpty().withMessage('consentType is required.')
        .isIn(['data_processing', 'feedback_anonymity', 'analytics'])
        .withMessage('consentType must be one of: data_processing, feedback_anonymity, analytics.'),
    body('consentGiven')
        .isBoolean().withMessage('consentGiven must be a boolean.'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validatePasswordChange,
    validateFeedback,
    validateOTPRequest,
    validateOTPVerify,
    validateObjectIdParam,
    validateConsent
};
