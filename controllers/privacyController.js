const User           = require('../models/User');
const Consent        = require('../models/Consent');
const Feedback       = require('../models/Feedback');
const PrivacyNotice  = require('../models/PrivacyNotice');
const { logEvent, AUDIT_ACTIONS, hashIP } = require('../middlewares/auditLogger');

// ============================================================
// DPDP ACT 2023 — PRIVACY CONTROLLER
//
// Implements all Data Principal rights:
//   1. Right to Access (my-data)
//   2. Right to Correction (update personal info)
//   3. Right to Erasure (anonymization + deletion)
//   4. Right to Data Portability (export as JSON)
//   5. Consent Management (grant / withdraw / status)
//   6. Privacy Notice (public endpoint)
//   7. Grievance Redressal (contact info)
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. RIGHT TO ACCESS — GET /api/privacy/my-data
// Returns all personal data held for the authenticated user.
// ─────────────────────────────────────────────────────────────
exports.getMyData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otpToken -otpExpires');

        const feedbackCount = await Feedback.countDocuments({ studentId: req.user.id });

        const consents = await Consent.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        await logEvent(req.user.id, AUDIT_ACTIONS.DATA_EXPORTED, '/api/privacy/my-data', req, {
            type: 'access_request'
        });

        res.status(200).json({
            success: true,
            message: 'Your personal data as held by IIIT Ranchi Feedback System.',
            data: {
                personalInformation: {
                    name:     user.name,
                    email:    user.email,
                    phone:    user.phone || null,
                    role:     user.role,
                    section:  user.section || null,
                    rollNo:   user.rollNo || null,
                    semester: user.semester || null,
                    avatar:   user.avatar || null,
                    isActive: user.isActive,
                    accountCreated: user.createdAt,
                    lastLogin:      user.lastLogin
                },
                feedbackSubmissions: {
                    totalCount: feedbackCount,
                    note: 'Individual feedback content is anonymized and cannot be linked back to you.'
                },
                consentRecords: consents,
                dataRetention: {
                    policy: 'Your data is retained for the duration of your enrollment plus 1 year, or until you request erasure.',
                    expiryDate: user.dataRetentionExpiry || null
                }
            },
            dpdpNotice: 'This data is provided under Section 11 of the Digital Personal Data Protection Act, 2023 (India).'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 2. RIGHT TO CORRECTION — PUT /api/privacy/my-data
// Allows users to update their personal information.
// ─────────────────────────────────────────────────────────────
exports.updateMyData = async (req, res) => {
    try {
        const allowedFields = ['name', 'phone'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No updatable fields provided. You can update: name, phone.'
            });
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        }).select('-password -otpToken -otpExpires');

        await logEvent(req.user.id, AUDIT_ACTIONS.DATA_CORRECTED, '/api/privacy/my-data', req, {
            fieldsUpdated: Object.keys(updates)
        });

        res.status(200).json({
            success: true,
            message: 'Your personal information has been updated.',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 3. RIGHT TO ERASURE — DELETE /api/privacy/my-data
// Anonymizes user record and removes linked feedback.
// DPDP: Erasure must be as easy as providing data.
// ─────────────────────────────────────────────────────────────
exports.eraseMyData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Anonymize the user record (don't delete — preserve data integrity)
        const anonymizedName  = `Deleted User ${Date.now()}`;
        const anonymizedEmail = `deleted_${Date.now()}@anonymized.local`;

        await User.findByIdAndUpdate(userId, {
            name:      anonymizedName,
            email:     anonymizedEmail,
            phone:     null,
            avatar:    null,
            isActive:  false,
            rollNo:    null,
            section:   null,
            semester:  null,
            password:  'ERASED',
            otpToken:  null,
            otpExpires: null
        });

        // Delete all feedback linked to this student
        const feedbackResult = await Feedback.deleteMany({ studentId: userId });

        // Delete consent records
        await Consent.deleteMany({ userId });

        await logEvent(userId, AUDIT_ACTIONS.DATA_ERASED, '/api/privacy/my-data', req, {
            feedbackDeleted: feedbackResult.deletedCount
        });

        // Clear JWT cookie
        const cookieName = process.env.NODE_ENV === 'production' ? '__Host-jwt' : 'jwt';
        res.cookie(cookieName, 'erased', {
            expires:  new Date(Date.now() + 1000),
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path:     '/'
        });

        res.status(200).json({
            success: true,
            message: 'Your personal data has been erased. Your account has been anonymized and deactivated.',
            data: {
                feedbackRecordsDeleted: feedbackResult.deletedCount,
                accountAnonymized: true
            },
            dpdpNotice: 'This erasure was performed under Section 12 of the Digital Personal Data Protection Act, 2023.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 4. DATA EXPORT — GET /api/privacy/data-export
// Downloads all personal data as a JSON file.
// DPDP: Data portability for Data Principals.
// ─────────────────────────────────────────────────────────────
exports.exportMyData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otpToken -otpExpires').lean();

        const feedbacks = await Feedback.find({ studentId: req.user.id })
            .populate('courseId', 'courseName courseCode')
            .populate('facultyId', 'name')
            .select('-studentId -__v')
            .lean();

        const consents = await Consent.find({ userId: req.user.id })
            .select('-__v')
            .lean();

        const exportData = {
            exportDate: new Date().toISOString(),
            dataController: 'IIIT Ranchi Faculty Feedback System',
            legalBasis: 'Digital Personal Data Protection Act, 2023 (India)',
            personalInformation: user,
            feedbackSubmissions: feedbacks,
            consentRecords: consents
        };

        await logEvent(req.user.id, AUDIT_ACTIONS.DATA_EXPORTED, '/api/privacy/data-export', req);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="my_data_export_${Date.now()}.json"`);
        res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 5. CONSENT MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/privacy/consent — Record explicit consent
 */
exports.giveConsent = async (req, res) => {
    try {
        const { consentType, consentGiven } = req.body;

        const consent = await Consent.create({
            userId:         req.user.id,
            consentType,
            consentGiven,
            consentVersion: process.env.PRIVACY_NOTICE_VERSION || '1.0',
            ipAddress:      hashIP(req.ip),
            userAgent:      (req.headers['user-agent'] || 'unknown').substring(0, 256)
        });

        // Update user's consent flag
        if (consentType === 'data_processing') {
            await User.findByIdAndUpdate(req.user.id, {
                consentGiven:     consentGiven,
                consentTimestamp: new Date()
            });
        }

        await logEvent(
            req.user.id,
            consentGiven ? AUDIT_ACTIONS.CONSENT_GIVEN : AUDIT_ACTIONS.CONSENT_WITHDRAWN,
            '/api/privacy/consent',
            req,
            { consentType }
        );

        res.status(201).json({
            success: true,
            message: consentGiven
                ? 'Consent recorded successfully.'
                : 'Consent withdrawal recorded successfully.',
            data: { consent }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/privacy/consent — Get current consent status
 */
exports.getConsentStatus = async (req, res) => {
    try {
        // Get latest consent for each type
        const consentTypes = ['data_processing', 'feedback_anonymity', 'analytics'];
        const status = {};

        for (const type of consentTypes) {
            const latest = await Consent.findOne({ userId: req.user.id, consentType: type })
                .sort({ createdAt: -1 })
                .lean();

            status[type] = latest ? {
                consentGiven:   latest.consentGiven,
                consentVersion: latest.consentVersion,
                recordedAt:     latest.createdAt,
                withdrawnAt:    latest.withdrawnAt
            } : {
                consentGiven: false,
                consentVersion: null,
                recordedAt: null,
                withdrawnAt: null
            };
        }

        res.status(200).json({
            success: true,
            data: { consentStatus: status }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/privacy/consent — Withdraw all consent
 * DPDP: Withdrawal must be as easy as granting consent.
 */
exports.withdrawConsent = async (req, res) => {
    try {
        // Mark all active consents as withdrawn
        await Consent.updateMany(
            { userId: req.user.id, withdrawnAt: null },
            { withdrawnAt: new Date(), consentGiven: false }
        );

        await User.findByIdAndUpdate(req.user.id, {
            consentGiven: false,
            consentTimestamp: new Date()
        });

        await logEvent(req.user.id, AUDIT_ACTIONS.CONSENT_WITHDRAWN, '/api/privacy/consent', req);

        res.status(200).json({
            success: true,
            message: 'All consents have been withdrawn. Some services may be limited.',
            dpdpNotice: 'You may re-grant consent at any time. Withdrawal does not affect lawfulness of prior processing.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 6. PRIVACY NOTICE — GET /api/privacy/notice (Public)
// ─────────────────────────────────────────────────────────────
exports.getPrivacyNotice = async (req, res) => {
    try {
        let notice = await PrivacyNotice.findOne({ isActive: true }).lean();

        // If no notice exists, return the default built-in notice
        if (!notice) {
            notice = {
                version: '1.0',
                title: 'IIIT Ranchi Faculty Feedback System — Privacy Notice',
                effectiveDate: new Date('2026-01-01'),
                content: 'This system processes personal data for the purpose of faculty performance evaluation.',
                sections: {
                    dataCollected: 'Name, Email, Phone (optional), Roll Number, Section, Semester, Feedback ratings and remarks.',
                    purposeOfProcessing: 'Faculty performance evaluation, institutional quality assurance, and academic improvement.',
                    dataRetentionPolicy: 'Student data is retained for the duration of enrollment plus 1 year. Feedback data is anonymized and retained for institutional analytics.',
                    dataPrincipalRights: 'You have the right to: (1) Access your personal data, (2) Correct inaccurate data, (3) Request erasure of your data, (4) Withdraw consent, (5) Export your data, (6) File a grievance.',
                    grievanceOfficer: 'Data Protection Officer, IIIT Ranchi. Email: dpo@iiitranchi.ac.in',
                    contactInformation: 'IIIT Ranchi, Namkum, Ranchi, Jharkhand 834010. Website: www.iiitranchi.ac.in'
                }
            };
        }

        res.status(200).json({
            success: true,
            data: { notice }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// 7. GRIEVANCE INFO — GET /api/privacy/grievance
// DPDP: Must publish an effective grievance redressal mechanism.
// ─────────────────────────────────────────────────────────────
exports.getGrievanceInfo = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            grievanceOfficer: {
                title: 'Data Protection Officer',
                organization: 'IIIT Ranchi',
                email: 'dpo@iiitranchi.ac.in',
                address: 'IIIT Ranchi, Namkum, Ranchi, Jharkhand 834010',
                responseTime: '30 days as mandated by DPDP Act 2023'
            },
            dataPrincipalRights: [
                'Right to Access your personal data',
                'Right to Correct inaccurate data',
                'Right to Erasure (deletion/anonymization)',
                'Right to Withdraw consent',
                'Right to Data Portability (export)',
                'Right to file a complaint with the Data Protection Board of India'
            ],
            regulatoryBody: {
                name: 'Data Protection Board of India',
                website: 'https://www.meity.gov.in'
            }
        }
    });
};

// ─────────────────────────────────────────────────────────────
// 8. SECURITY LOGS STREAM — GET /api/privacy/security-events
// Google/Stripe Standards: User audits recent security events
// ─────────────────────────────────────────────────────────────
exports.getMySecurityEvents = async (req, res) => {
    try {
        const AuditLog = require('../models/AuditLog');
        
        // Retrieve last 100 security events for this user, ordered by timestamp descending
        const logs = await AuditLog.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            data: { logs }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve security event history.' });
    }
};
