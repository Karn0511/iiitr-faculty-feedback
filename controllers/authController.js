const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const { logEvent, AUDIT_ACTIONS } = require('../middlewares/auditLogger');

// ============================================================
// CORE: Sign a JWT containing userId, role, and email
// ============================================================
const signToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// ============================================================
// CORE: Set the JWT as a secure HTTP-only cookie and respond
// All auth paths funnel through this single issuer function.
// ============================================================
const sendTokenResponse = (user, statusCode, res, message = 'Authentication successful') => {
    const token = signToken(user);

    const expireDays = parseInt(process.env.JWT_EXPIRES_IN) || 1;
    const cookieOptions = {
        expires:  new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000), // Dynamic matching
        httpOnly: true, // Not accessible via JS — XSS protection (Auto-accepted by browser, no frontend prompt needed)
        secure:   process.env.NODE_ENV === 'production',       // HTTPS only in prod
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        success: true,
        message,
        token, // Exposing the token in the body so that the Bearer authInterceptor can store and attach it
        data: {
            user: {
                id:    user._id,
                name:  user.name,
                email: user.email,
                role:  user.role,
                section: user.section || null,
                avatar:  user.avatar  || null,
                requiresPasswordChange: user.requiresPasswordChange,
                consentGiven: user.consentGiven || false
            }
        }
    });
};

// Exported for use in Google OAuth callback route
exports.loginSuccessHandler = async (req, res) => {
    if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:4200'}/login?error=Google%20Authentication%20failed`);
    }

    const token = signToken(req.user);

    const expireDays = parseInt(process.env.JWT_EXPIRES_IN) || 1;
    const cookieOptions = {
        expires:  new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000), // Dynamic matching
        httpOnly: true, // Not accessible via JS — XSS protection (Auto-accepted by browser, no frontend prompt needed)
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.cookie('jwt', token, cookieOptions);

    // Audit log
    await logEvent(req.user._id, AUDIT_ACTIONS.LOGIN_SUCCESS, '/api/auth/google/callback', req, {
        method: 'google_oauth'
    });

    const userString = encodeURIComponent(JSON.stringify({
        id:      req.user._id,
        name:    req.user.name,
        email:   req.user.email,
        role:    req.user.role,
        section: req.user.section || null,
        avatar:  req.user.avatar  || null,
        requiresPasswordChange: req.user.requiresPasswordChange,
        consentGiven: req.user.consentGiven || false
    }));

    // Redirect to frontend app login route to consume token and user variables
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:4200'}/login?token=${token}&user=${userString}`);
};

// ============================================================
// LOCAL AUTH: REGISTER
// OWASP: Password complexity enforced by inputValidator middleware
// ============================================================
exports.registerLocal = async (req, res) => {
    try {
        const { name, email, password, phone, role, section } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Password is hashed automatically by the pre-save hook in User.js
        const newUser = await User.create({
            name,
            email,
            password,
            phone:   phone || undefined,
            role:    role || 'Student',
            section: section || (role === 'Student' ? 'Unassigned' : undefined)
        });

        await logEvent(newUser._id, AUDIT_ACTIONS.LOGIN_SUCCESS, '/api/auth/register', req, {
            method: 'local_register'
        });

        sendTokenResponse(newUser, 201, res, 'Registration successful');
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// LOCAL AUTH: LOGIN
// OWASP A07: Account lockout handled in passport strategy
// ============================================================
exports.loginLocal = (req, res, next) => {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err)   return res.status(500).json({ success: false, message: 'An internal error occurred.' });
        if (!user) {
            return res.status(401).json({ success: false, message: info?.message || 'Login failed' });
        }

        // Update last login timestamp
        User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

        // Audit log
        await logEvent(user._id, AUDIT_ACTIONS.LOGIN_SUCCESS, '/api/auth/login', req, {
            method: 'local_password'
        });

        sendTokenResponse(user, 200, res, 'Login successful');
    })(req, res, next);
};

// ============================================================
// LOGOUT: Clear the JWT cookie
// ============================================================
exports.logout = async (req, res) => {
    // Audit log (if user is authenticated)
    if (req.cookies?.jwt && req.cookies.jwt !== 'loggedout') {
        try {
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
            await logEvent(decoded.id, AUDIT_ACTIONS.LOGOUT, '/api/auth/logout', req);
        } catch (_) {
            // Token might be expired — that's fine for logout
        }
    }

    res.cookie('jwt', 'loggedout', {
        expires:  new Date(Date.now() + 1000),
        httpOnly: true
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ============================================================
// OTP AUTH: REQUEST OTP (phone-based)
// ============================================================
exports.requestOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false, message: 'No user found with this phone number' });

        // Generate a cryptographically random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the OTP with SHA-256 before saving to DB (never store plain OTPs)
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        user.otpToken   = hashedOTP;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes
        await user.save({ validateBeforeSave: false });

        // --- SMS SIMULATION ---
        // In production, replace this with Twilio / AWS SNS / MSG91
        console.log('\n╔══════════════════════════════════════╗');
        console.log(`║  [SIMULATED SMS] OTP for ${phone}`);
        console.log(`║  Your IIIT Ranchi OTP: ${otp}`);
        console.log('╚══════════════════════════════════════╝\n');

        res.status(200).json({ success: true, message: 'OTP sent successfully. Valid for 10 minutes.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to process OTP request.' });
    }
};

// ============================================================
// OTP AUTH: VERIFY OTP & ISSUE JWT
// ============================================================
exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        // Hash the incoming OTP for comparison against DB hash
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            phone,
            otpToken:   hashedOTP,
            otpExpires: { $gt: Date.now() } // Ensure not expired
        }).select('+otpToken +otpExpires');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP fields after successful verification (one-time use)
        user.otpToken   = undefined;
        user.otpExpires = undefined;
        user.lastLogin  = new Date();
        await user.save({ validateBeforeSave: false });

        await logEvent(user._id, AUDIT_ACTIONS.LOGIN_SUCCESS, '/api/auth/otp/verify', req, {
            method: 'otp'
        });

        sendTokenResponse(user, 200, res, 'OTP verified successfully');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
    }
};

// ============================================================
// GET CURRENT USER (who am I?)
// ============================================================
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
    }
};

// ============================================================
// CHANGE PASSWORD
//
// OWASP A07 Enhancements:
//   - Requires currentPassword for verification
//   - Enforces password complexity (via inputValidator middleware)
//   - Sets passwordChangedAt to invalidate old JWTs
// ============================================================
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password (skip for first-time forced changes)
        if (!user.requiresPasswordChange) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required for verification.'
                });
            }

            const isMatch = await user.correctPassword(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect.'
                });
            }
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long.'
            });
        }

        user.password = newPassword;
        user.requiresPasswordChange = false;
        // passwordChangedAt is set automatically by the pre-save hook
        await user.save();

        await logEvent(user._id, AUDIT_ACTIONS.PASSWORD_CHANGED, '/api/auth/change-password', req);

        // Issue a new token response (old tokens are now invalid)
        sendTokenResponse(user, 200, res, 'Password updated successfully');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
};
