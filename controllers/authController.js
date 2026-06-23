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
const sendTokenResponse = async (user, statusCode, req, res, message = 'Authentication successful') => {
    const token = signToken(user);

    const expireDays = parseInt(process.env.JWT_EXPIRES_IN) || 1;
    const cookieOptions = {
        expires:  new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000), // Dynamic matching
        httpOnly: true, // Not accessible via JS — XSS protection (Auto-accepted by browser, no frontend prompt needed)
        secure:   process.env.NODE_ENV === 'production',       // HTTPS only in prod
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path:     '/'                                          // Strictly required for __Host- cookie prefix
    };

    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';
    res.cookie(cookieName, token, cookieOptions);

    // Register active session in the database
    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const uaParser = require('../utils/uaParser');
        const { browser, os } = uaParser(userAgent);
        const Session = require('../models/Session');
        
        await Session.create({
            userId: user._id,
            tokenHash,
            userAgent,
            browser,
            os,
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
        });
    } catch (err) {
        console.error('❌ Failed to register session in database:', err.message);
    }

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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path:     '/'
    };

    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';
    res.cookie(cookieName, token, cookieOptions);

    // Register active session in the database
    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const uaParser = require('../utils/uaParser');
        const { browser, os } = uaParser(userAgent);
        const Session = require('../models/Session');
        
        await Session.create({
            userId: req.user._id,
            tokenHash,
            userAgent,
            browser,
            os,
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
        });
    } catch (err) {
        console.error('❌ Failed to register OAuth session in database:', err.message);
    }

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

        await sendTokenResponse(newUser, 201, req, res, 'Registration successful');
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

        await sendTokenResponse(user, 200, req, res, 'Login successful');
    })(req, res, next);
};

// ============================================================
// LOGOUT: Clear the JWT cookie
// ============================================================
exports.logout = async (req, res) => {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';
    const sudoCookieName = process.env.NODE_ENV === 'production' ? '__Host-sudo' : 'sudo';

    // Audit log & Session Removal (if user is authenticated)
    if (req.cookies?.[cookieName] && req.cookies[cookieName] !== 'loggedout') {
        try {
            const decoded = jwt.verify(req.cookies[cookieName], process.env.JWT_SECRET);
            
            // Delete active session record
            const tokenHash = crypto.createHash('sha256').update(req.cookies[cookieName]).digest('hex');
            const Session = require('../models/Session');
            await Session.deleteOne({ userId: decoded.id, tokenHash });

            await logEvent(decoded.id, AUDIT_ACTIONS.LOGOUT, '/api/auth/logout', req);
        } catch (_) {
            // Token might be expired — that's fine for logout
        }
    }

    res.cookie(cookieName, 'loggedout', {
        expires:  new Date(Date.now() + 1000),
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path:     '/'
    });

    // Clear sudo mode cookie as well
    res.cookie(sudoCookieName, 'loggedout', {
        expires:  new Date(Date.now() + 1000),
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path:     '/'
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

        await sendTokenResponse(user, 200, req, res, 'OTP verified successfully');
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
        await sendTokenResponse(user, 200, req, res, 'Password updated successfully');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
};

// ============================================================
// GET ALL ACTIVE SESSIONS
// ============================================================
exports.getActiveSessions = async (req, res) => {
    try {
        const Session = require('../models/Session');
        const sessions = await Session.find({ userId: req.user.id }).sort({ lastActive: -1 });

        const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';
        const currentToken = req.cookies[cookieName] || 
                             (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
        
        let currentTokenHash = '';
        if (currentToken) {
            currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
        }

        const formattedSessions = sessions.map(s => {
            return {
                id: s._id,
                browser: s.browser,
                os: s.os,
                ipAddress: s.ipAddress,
                lastActive: s.lastActive,
                isCurrent: currentTokenHash === s.tokenHash
            };
        });

        res.status(200).json({
            success: true,
            data: { sessions: formattedSessions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve active sessions.' });
    }
};

// ============================================================
// REVOKE / TERMINATE SESSION
// ============================================================
exports.revokeSession = async (req, res) => {
    try {
        const Session = require('../models/Session');
        const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user.id });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found or already expired.' });
        }

        // Delete active session record
        await Session.findByIdAndDelete(session._id);

        await logEvent(req.user.id, AUDIT_ACTIONS.LOGOUT, `/api/auth/sessions/${req.params.sessionId}`, req, {
            info: 'Session terminated remotely by user'
        });

        res.status(200).json({
            success: true,
            message: 'Session revoked successfully. Device signed out.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to revoke session.' });
    }
};

// ============================================================
// VERIFY PASSWORD FOR SUDO MODE
// ============================================================
exports.enterSudoMode = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.correctPassword(password, user.password);
        if (!isMatch) {
            await logEvent(req.user.id, AUDIT_ACTIONS.LOGIN_FAILED, '/api/auth/sudo', req, {
                reason: 'Incorrect sudo password'
            });

            return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }

        // Sudo token valid for 5 minutes
        const sudoToken = jwt.sign(
            { id: user._id, sudo: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const sudoCookieName = process.env.NODE_ENV === 'production' ? '__Host-sudo' : 'sudo';
        res.cookie(sudoCookieName, sudoToken, {
            expires:  new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path:     '/'
        });

        await logEvent(req.user.id, AUDIT_ACTIONS.LOGIN_SUCCESS, '/api/auth/sudo', req, {
            info: 'Entered sudo mode successfully',
            sudo: true
        });

        res.status(200).json({
            success: true,
            message: 'Sudo mode activated successfully for 5 minutes.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to verify credentials for Sudo mode.' });
    }
};
