const mongoose = require('mongoose');

// ============================================================
// CONSENT MODEL — DPDP Act 2023 Compliance
//
// Maintains a verifiable, immutable consent audit trail.
// Each consent action (grant or withdrawal) creates a new record
// rather than updating an existing one, ensuring full traceability.
//
// DPDP Requirements:
//   - Consent must be free, specific, informed, and unambiguous
//   - Withdrawal must be as easy as granting consent
//   - Records must be maintained for verification
// ============================================================

const consentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    consentType: {
        type: String,
        enum: ['data_processing', 'feedback_anonymity', 'analytics'],
        required: [true, 'Consent type is required']
    },
    consentGiven: {
        type: Boolean,
        required: [true, 'Consent decision is required']
    },
    consentVersion: {
        type: String,
        default: '1.0'
    },
    ipAddress: {
        type: String,  // Stored as SHA-256 hash for privacy
        default: 'unknown'
    },
    userAgent: {
        type: String,
        maxlength: 256,
        default: 'unknown'
    },
    withdrawnAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true  // createdAt = consent timestamp
});

// Compound index for fast consent status lookups
consentSchema.index({ userId: 1, consentType: 1, createdAt: -1 });

module.exports = mongoose.model('Consent', consentSchema);
