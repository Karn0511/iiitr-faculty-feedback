const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenHash: {
        type: String,
        required: true,
        index: true
    },
    userAgent: {
        type: String,
        required: true
    },
    browser: {
        type: String,
        default: 'Unknown Browser'
    },
    os: {
        type: String,
        default: 'Unknown OS'
    },
    ipAddress: {
        type: String,
        default: 'Unknown IP'
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d' // TTL index to automatically purge inactive sessions after 7 days
    }
}, {
    timestamps: true
});

// Compound index to speed up session lookup per user
SessionSchema.index({ userId: 1, tokenHash: 1 });

module.exports = mongoose.model('Session', SessionSchema);
