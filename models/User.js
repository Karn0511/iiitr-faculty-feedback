const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================
// USER MODEL — DPDP + OWASP Enhanced
//
// Added fields:
//   - failedLoginAttempts / lockUntil  → Account lockout (OWASP A07)
//   - passwordChangedAt               → JWT invalidation after pwd change
//   - consentGiven / consentTimestamp  → DPDP consent tracking
//   - dataRetentionExpiry             → DPDP data lifecycle
// ============================================================

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        select: false // Never returned in queries by default
    },
    phone: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values without violating uniqueness
    },
    otpToken: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Faculty', 'Student'],
        required: [true, 'Role is required']
    },
    section: {
        type: String,
        required: function () {
            return this.role === 'Student';
        },
        trim: true
    },
    rollNo: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        required: function () {
            return this.role === 'Student';
        }
    },
    semester: {
        type: Number,
        required: function () {
            return this.role === 'Student';
        }
    },
    requiresPasswordChange: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    avatar: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date
    },

    // ─── OWASP A07: Account Lockout ───────────────────────────
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },

    // ─── OWASP A07: JWT Invalidation After Password Change ───
    passwordChangedAt: {
        type: Date,
        default: null
    },

    // ─── DPDP: Consent Management ────────────────────────────
    consentGiven: {
        type: Boolean,
        default: false
    },
    consentTimestamp: {
        type: Date,
        default: null
    },

    // ─── DPDP: Data Retention Lifecycle ──────────────────────
    dataRetentionExpiry: {
        type: Date,
        default: null  // Set by admin based on enrollment period
    }
}, {
    timestamps: true
});

// =============================================================
// VIRTUAL: Check if account is currently locked
// =============================================================
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// =============================================================
// PRE-SAVE HOOK: Hash password with bcrypt (salt rounds: 12)
// Only runs when the password field has been modified.
// Also sets passwordChangedAt for JWT invalidation.
// =============================================================
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    // Skip hashing for anonymization markers
    if (this.password === 'ERASED' || this.password === 'RETENTION_EXPIRED') return;
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = new Date();
});

// Instance method: verify a plain-text password against the stored hash
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method: check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return jwtTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method: increment failed login attempts and lock if threshold exceeded
userSchema.methods.incrementLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set:   { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

// Instance method: reset failed login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $set:   { failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

module.exports = mongoose.model('User', userSchema);
