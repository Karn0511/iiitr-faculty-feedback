const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// ============================================================
// RATE LIMITERS
// Prevents brute-force attacks on sensitive auth endpoints
// ============================================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts per window
    message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Max 3 OTP requests per minute
    message: { success: false, message: 'Too many OTP requests. Please wait a minute.' }
});

// ============================================================
// LOCAL AUTH ROUTES
// ============================================================
router.post('/register', authLimiter, authController.registerLocal);
router.post('/login',    authLimiter, authController.loginLocal);
router.get('/logout',                 authController.logout);

// ============================================================
// OTP AUTH ROUTES
// ============================================================
router.post('/otp/request', otpLimiter, authController.requestOTP);
router.post('/otp/verify',  authLimiter, authController.verifyOTP);

// ============================================================
// GOOGLE OAUTH ROUTES
// ============================================================
// Step 1: Redirect user to Google's consent screen
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here after user consents
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/api/auth/google/failure'
    }),
    authController.loginSuccessHandler
);

// Google OAuth failure handler
router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Google authentication failed. Only @iiitranchi.ac.in accounts are allowed.'
    });
});

// ============================================================
// PROTECTED: Current user info
// ============================================================
router.get('/me', protect, authController.getMe);

module.exports = router;
