const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logEvent, AUDIT_ACTIONS } = require('./auditLogger');

// ============================================================
// PROTECT: Verify JWT and attach user to req.user
// Accepts token from HTTP-only cookie OR Bearer header
//
// OWASP A07 Enhancements:
//   - Validates passwordChangedAt vs JWT iat (issued-at)
//   - Rejects tokens for locked accounts
//   - Audit logs unauthorized access attempts
// ============================================================
exports.protect = async (req, res, next) => {
    try {
        let token;
        const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';

        // Priority 1: HTTP-only cookie (preferred — XSS safe)
        if (req.cookies && req.cookies[cookieName]) {
            token = req.cookies[cookieName];
        }
        // Priority 2: Authorization header (for API clients / mobile)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please log in to access this resource.'
            });
        }

        // Verify token signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Enforce active session check in database
        const crypto = require('crypto');
        const Session = require('../models/Session');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const session = await Session.findOne({ userId: decoded.id, tokenHash });
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Your session has expired or been revoked. Please log in again.'
            });
        }

        // Update last active activity (non-blocking)
        Session.findByIdAndUpdate(session._id, { lastActive: new Date() }).exec();

        // Confirm the user still exists in DB (handles deleted account edge case)
        const currentUser = await User.findById(decoded.id)
            .select('+passwordChangedAt +failedLoginAttempts +lockUntil');

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'The account associated with this token no longer exists.'
            });
        }

        // Check if account is locked
        if (currentUser.lockUntil && currentUser.lockUntil > Date.now()) {
            return res.status(403).json({
                success: false,
                message: 'Your account is temporarily locked. Please try again later.'
            });
        }

        if (!currentUser.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact the administrator.'
            });
        }

        // OWASP A07: Invalidate JWT if password was changed after token was issued
        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: 'Password was recently changed. Please log in again.'
            });
        }

        // Attach full user object to request for downstream use
        req.user = currentUser;
        next();
    } catch (error) {
        // Log unauthorized access attempts
        await logEvent(null, AUDIT_ACTIONS.UNAUTHORIZED_ACCESS, req.originalUrl, req, {
            error: 'Invalid or expired token'
        });

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please log in again.'
        });
    }
};

// ============================================================
// RESTRICT TO: Role-Based Access Control (RBAC)
// Usage: restrictTo('Admin', 'Faculty')
// Must always be used AFTER protect middleware.
// ============================================================
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // Log unauthorized role-based access attempts
            logEvent(req.user?.id, AUDIT_ACTIONS.UNAUTHORIZED_ACCESS, req.originalUrl, req, {
                requiredRoles: roles,
                userRole: req.user.role
            });

            return res.status(403).json({
                success: false,
                message: `Access denied. This route is restricted to: ${roles.join(', ')}.`
            });
        }
        next();
    };
};

// ============================================================
// REQUIRE SUDO: Guard high-risk routes behind 5m credential check
// ============================================================
exports.requireSudo = async (req, res, next) => {
    try {
        const sudoCookieName = process.env.NODE_ENV === 'production' ? '__Host-sudo' : 'sudo';
        const sudoToken = req.cookies?.[sudoCookieName];

        if (!sudoToken) {
            return res.status(403).json({
                success: false,
                sudoRequired: true,
                message: 'Security verification required. Please enter your password to proceed.'
            });
        }

        const decodedSudo = jwt.verify(sudoToken, process.env.JWT_SECRET);

        // Verify that the sudo session belongs to the authenticated user
        if (decodedSudo.id !== req.user.id || !decodedSudo.sudo) {
            return res.status(403).json({
                success: false,
                sudoRequired: true,
                message: 'Invalid security verification context. Please re-authenticate.'
            });
        }

        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            sudoRequired: true,
            message: 'Security verification expired. Please enter your password to proceed.'
        });
    }
};
