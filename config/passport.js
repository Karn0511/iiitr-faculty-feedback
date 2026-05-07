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
            // CRITICAL DOMAIN LOCK
            // Extract the domain portion of the email (after '@').
            // Authentication is BLOCKED for any domain other than
            // 'iiitranchi.ac.in' — this is the single point of institutional
            // access control enforced at the OAuth level.
            // ==============================================================
            if (email.split('@')[1] !== 'iiitranchi.ac.in') {
                return done(null, false, {
                    message: 'Access denied. Only @iiitranchi.ac.in accounts are permitted.'
                });
            }

            // Find or auto-create the user
            let user = await User.findOne({ email });

            if (!user) {
                user = await User.create({
                    name:    profile.displayName,
                    email:   email,
                    avatar:  profile.photos?.[0]?.value || null,
                    role:    'Student', // Default role — Admin can elevate
                    section: 'Unassigned'
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
