const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// ==========================================
// STRATEGY 1: LOCAL (Email + Password)
// ==========================================
passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
        try {
            // Explicitly select password since it has select: false
            const user = await User.findOne({ email }).select('+password');

            if (!user || !user.password) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            const isMatch = await user.correctPassword(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password' });
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
        scope: ['profile', 'email']
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

            // Find or auto-create the user
            let user = await User.findOne({ email });

            if (!user) {
                // Auto-elevate creator/tester to Admin role in development
                let role = 'Student';
                if (email.startsWith('karn') || email.includes('admin')) {
                    role = 'Admin';
                } else if (email.includes('faculty')) {
                    role = 'Faculty';
                }

                user = await User.create({
                    name:    profile.displayName,
                    email:   email,
                    avatar:  profile.photos?.[0]?.value || null,
                    role:    role,
                    section: 'A'
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
