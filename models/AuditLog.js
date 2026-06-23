const mongoose = require('mongoose');

// ============================================================
// AUDIT LOG MODEL — Security Event Tracking
//
// OWASP A09:2021 — Security Logging and Monitoring Failures
// DPDP Act — Accountability and breach detection
//
// Stores security-critical events with:
//   - Hashed IP addresses (DPDP privacy compliance)
//   - TTL index for automatic 365-day expiry
//   - Structured action categories
// ============================================================

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null  // Null for anonymous events (failed logins with unknown user)
    },
    action: {
        type: String,
        required: [true, 'Action type is required'],
        enum: [
            'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
            'PASSWORD_CHANGED',
            'CONSENT_GIVEN', 'CONSENT_WITHDRAWN',
            'DATA_EXPORTED', 'DATA_ERASED', 'DATA_CORRECTED',
            'FEEDBACK_SUBMITTED',
            'ADMIN_USER_UPLOAD', 'ADMIN_SESSION_TOGGLE', 'ADMIN_QUESTION_TOGGLE',
            'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_HIT',
            'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'
        ],
        index: true
    },
    resource: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,   // SHA-256 hash (truncated to 16 chars)
        default: 'unknown'
    },
    userAgent: {
        type: String,
        maxlength: 256,
        default: 'unknown'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// TTL index: automatically delete audit logs after 365 days
// DPDP: data minimization — don't retain logs longer than necessary
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Compound indexes for efficient admin queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
