const mongoose = require('mongoose');

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
    role: {
        type: String,
        enum: ['Admin', 'Faculty', 'Student'],
        required: [true, 'Role is required']
    },
    section: {
        type: String,
        required: function() {
            return this.role === 'Student';
        },
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
