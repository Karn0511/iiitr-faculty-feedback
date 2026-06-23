const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const { logEvent, AUDIT_ACTIONS } = require('../middlewares/auditLogger');

// ==========================================
// STRATEGY 1: LOCAL (Email + Password)
//
// OWASP A07: Identification & Authentication Failures
//   - Account lockout after 5 failed attempts
//   - Generic error messages (don't reveal if email exists)
//   - Timing-safe comparison via bcrypt
// ==========================================
passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
        try {
            // Explicitly select password and lockout fields
            const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');

            // Generic message for all auth failures (OWASP: don't enumerate users)
            const genericFailMsg = 'Invalid email or password.';

            if (!user || !user.password) {
                return done(null, false, { message: genericFailMsg });
            }

            // Check if account is locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
                await logEvent(user._id, AUDIT_ACTIONS.LOGIN_FAILED, '/api/auth/login', req, {
                    reason: 'account_locked',
                    minutesLeft
                });
                return done(null, false, {
                    message: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return done(null, false, {
                    message: 'This account has been deactivated. Please contact the administrator.'
                });
            }

            const isMatch = await user.correctPassword(password, user.password);
            if (!isMatch) {
                // Increment failed attempts and potentially lock
                await user.incrementLoginAttempts();

                await logEvent(user._id, AUDIT_ACTIONS.LOGIN_FAILED, '/api/auth/login', req, {
                    reason: 'invalid_password',
                    failedAttempts: user.failedLoginAttempts + 1
                });

                // Check if this attempt triggers lockout
                if (user.failedLoginAttempts + 1 >= 5) {
                    await logEvent(user._id, AUDIT_ACTIONS.ACCOUNT_LOCKED, '/api/auth/login', req);
                }

                return done(null, false, { message: genericFailMsg });
            }

            // Successful login — reset failed attempts
            if (user.failedLoginAttempts > 0 || user.lockUntil) {
                await user.resetLoginAttempts();
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// ==========================================
// STRATEGY 2: GOOGLE OAUTH 2.0
// ==========================================
passport.use(
    new GoogleStrategy({
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  '/api/auth/google/callback',
        scope: ['profile', 'email'],
        proxy: true // Respect reverse proxy (Render) SSL headers to generate https callback URLs
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            // ==============================================================
            // RELAXED DOMAIN LOCK FOR DEVELOPMENT
            // Authenticates standard Google accounts during local testing,
            // while keeping the domain lock enabled in production.
            // ==============================================================
            const domain = email.split('@')[1];
            if (domain !== 'iiitranchi.ac.in' && process.env.NODE_ENV !== 'development') {
                return done(null, false, {
                    message: 'Access denied. Only @iiitranchi.ac.in accounts are permitted.'
                });
            }

            // Find the existing user
            let user = await User.findOne({ email });

            if (!user || (user.role !== 'Faculty' && user.role !== 'Admin')) {
                return done(null, false, {
                    message: 'Access denied. Google SSO is scoped exclusively for Faculty. Students must login via Roll Number.'
                });
            }

            // Update avatar & lastLogin on every successful OAuth login
            user.lastLogin = new Date();
            if (profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
            await user.save({ validateBeforeSave: false });

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    })
);

module.exports = passport;
