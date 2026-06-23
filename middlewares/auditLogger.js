const crypto = require('crypto');

// ============================================================
// AUDIT LOGGER — Security Event Tracking
//
// OWASP A09:2021 — Security Logging and Monitoring
// DPDP Act — Accountability & Breach Detection
//
// Logs security-critical events to MongoDB with:
//   - Hashed IP addresses (privacy-preserving)
//   - User agent tracking
//   - Structured action categories
//   - TTL index for automatic expiry (365 days)
// ============================================================

let AuditLog; // Lazy-loaded to avoid circular dependency issues

/**
 * Hash an IP address using SHA-256 for privacy compliance.
 * DPDP: IP addresses are personal data — store only hashes.
 *
 * @param {string} ip
 * @returns {string} SHA-256 hash of the IP
 */
function hashIP(ip) {
    if (!ip) return 'unknown';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Log a security event to the AuditLog collection.
 *
 * @param {string|null} userId    - User performing the action (null for anonymous)
 * @param {string}      action   - Action category (e.g., 'LOGIN_SUCCESS')
 * @param {string}      resource - Resource being accessed (e.g., '/api/auth/login')
 * @param {object}      req      - Express request object (for IP/UA extraction)
 * @param {object}      metadata - Additional context (optional)
 */
async function logEvent(userId, action, resource, req, metadata = {}) {
    try {
        // Lazy-load model to prevent circular dependencies at module init
        if (!AuditLog) {
            AuditLog = require('../models/AuditLog');
        }

        await AuditLog.create({
            userId:    userId || null,
            action,
            resource,
            ipAddress: hashIP(req?.ip || req?.connection?.remoteAddress),
            userAgent: (req?.headers?.['user-agent'] || 'unknown').substring(0, 256),
            metadata,
            timestamp: new Date()
        });
    } catch (err) {
        // Audit logging must never crash the application
        console.error(`[AUDIT] Failed to log event: ${action}`, err.message);
    }
}

// Predefined action constants for type-safety
const AUDIT_ACTIONS = {
    LOGIN_SUCCESS:       'LOGIN_SUCCESS',
    LOGIN_FAILED:        'LOGIN_FAILED',
    LOGOUT:              'LOGOUT',
    PASSWORD_CHANGED:    'PASSWORD_CHANGED',
    CONSENT_GIVEN:       'CONSENT_GIVEN',
    CONSENT_WITHDRAWN:   'CONSENT_WITHDRAWN',
    DATA_EXPORTED:       'DATA_EXPORTED',
    DATA_ERASED:         'DATA_ERASED',
    DATA_CORRECTED:      'DATA_CORRECTED',
    FEEDBACK_SUBMITTED:  'FEEDBACK_SUBMITTED',
    ADMIN_USER_UPLOAD:   'ADMIN_USER_UPLOAD',
    ADMIN_SESSION_TOGGLE:'ADMIN_SESSION_TOGGLE',
    ADMIN_QUESTION_TOGGLE:'ADMIN_QUESTION_TOGGLE',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_HIT:      'RATE_LIMIT_HIT',
    ACCOUNT_LOCKED:      'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED:    'ACCOUNT_UNLOCKED'
};

module.exports = { logEvent, AUDIT_ACTIONS, hashIP };
