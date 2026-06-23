const mongoose = require('mongoose');

// ============================================================
// DATA RETENTION SERVICE — DPDP Act 2023 Compliance
//
// Handles automated data lifecycle management:
//   - Finds users with expired data retention periods
//   - Anonymizes their records
//   - Logs all retention actions to AuditLog
//
// DPDP: Personal data must be deleted once the purpose
// of collection is fulfilled (Purpose Limitation).
//
// Usage: Can be invoked via cron job or admin endpoint.
// ============================================================

/**
 * Run data retention check and anonymize expired records.
 *
 * @returns {Object} Summary of retention actions taken
 */
async function runRetentionCheck() {
    const User     = require('../models/User');
    const Feedback = require('../models/Feedback');
    const Consent  = require('../models/Consent');
    const AuditLog = require('../models/AuditLog');

    const summary = {
        usersAnonymized: 0,
        feedbackDeleted: 0,
        consentsDeleted: 0,
        errors: []
    };

    try {
        // Find users whose data retention period has expired
        const expiredUsers = await User.find({
            dataRetentionExpiry: { $lt: new Date() },
            isActive: true  // Only process active accounts
        }).select('_id name email role');

        for (const user of expiredUsers) {
            try {
                // Anonymize user record
                const anonymizedName  = `Retained User ${user._id.toString().substring(0, 8)}`;
                const anonymizedEmail = `retained_${user._id}@anonymized.local`;

                await User.findByIdAndUpdate(user._id, {
                    name:       anonymizedName,
                    email:      anonymizedEmail,
                    phone:      null,
                    avatar:     null,
                    isActive:   false,
                    rollNo:     null,
                    section:    null,
                    semester:   null,
                    password:   'RETENTION_EXPIRED',
                    otpToken:   null,
                    otpExpires: null
                });

                // Delete linked feedback
                const feedbackResult = await Feedback.deleteMany({ studentId: user._id });
                summary.feedbackDeleted += feedbackResult.deletedCount;

                // Delete consent records
                const consentResult = await Consent.deleteMany({ userId: user._id });
                summary.consentsDeleted += consentResult.deletedCount;

                summary.usersAnonymized++;

                // Log the retention action
                await AuditLog.create({
                    userId:    user._id,
                    action:    'DATA_ERASED',
                    resource:  'data-retention-service',
                    ipAddress: 'system',
                    userAgent: 'DataRetentionService/1.0',
                    metadata: {
                        reason: 'Data retention period expired',
                        originalRole: user.role,
                        feedbackDeleted: feedbackResult.deletedCount
                    },
                    timestamp: new Date()
                });

                console.log(`[RETENTION] Anonymized: ${user.email} (${user.role})`);
            } catch (userErr) {
                summary.errors.push({
                    userId: user._id.toString(),
                    error: userErr.message
                });
                console.error(`[RETENTION] Error processing user ${user._id}:`, userErr.message);
            }
        }

        console.log(`[RETENTION] Check complete: ${summary.usersAnonymized} users anonymized, ${summary.feedbackDeleted} feedback deleted.`);
        return summary;

    } catch (err) {
        console.error('[RETENTION] Service error:', err.message);
        summary.errors.push({ error: err.message });
        return summary;
    }
}

module.exports = { runRetentionCheck };
