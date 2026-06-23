const mongoose = require('mongoose');

// ============================================================
// PRIVACY NOTICE MODEL — DPDP Act 2023 Compliance
//
// Stores versioned privacy notices so that consent records
// can reference which version of the notice was active when
// the user provided consent.
//
// DPDP Requirement: Data Fiduciary must provide a clear,
// accessible privacy notice to Data Principals.
// ============================================================

const privacyNoticeSchema = new mongoose.Schema({
    version: {
        type: String,
        required: [true, 'Version number is required'],
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Notice title is required'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Notice content is required']
    },
    effectiveDate: {
        type: Date,
        required: [true, 'Effective date is required']
    },
    isActive: {
        type: Boolean,
        default: false  // Only one notice should be active at a time
    },
    sections: {
        dataCollected: {
            type: String,
            default: ''
        },
        purposeOfProcessing: {
            type: String,
            default: ''
        },
        dataRetentionPolicy: {
            type: String,
            default: ''
        },
        dataPrincipalRights: {
            type: String,
            default: ''
        },
        grievanceOfficer: {
            type: String,
            default: ''
        },
        contactInformation: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PrivacyNotice', privacyNoticeSchema);
