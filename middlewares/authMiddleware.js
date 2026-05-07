const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================================
// PROTECT: Verify JWT and attach user to req.user
// Accepts token from HTTP-only cookie OR Bearer header
// ============================================================
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Priority 1: HTTP-only cookie (preferred — XSS safe)
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
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

        // Confirm the user still exists in DB (handles deleted account edge case)
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'The account associated with this token no longer exists.'
            });
        }

        if (!currentUser.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact the administrator.'
            });
        }

        // Attach full user object to request for downstream use
        req.user = currentUser;
        next();
    } catch (error) {
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
            return res.status(403).json({
                success: false,
                message: `Access denied. This route is restricted to: ${roles.join(', ')}.`
            });
        }
        next();
    };
};
