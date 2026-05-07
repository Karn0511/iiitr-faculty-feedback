const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    }
}, {
    timestamps: true
});

// =============================================================
// PRE-SAVE HOOK: Hash password with bcrypt (salt rounds: 12)
// Only runs when the password field has been modified.
// =============================================================
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method: verify a plain-text password against the stored hash
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
