const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackSession',
        default: null
    },
    dropPercentage: {
        type: Number,
        required: [true, 'Drop percentage is required']
    },
    previousScore: {
        type: Number,
        required: [true, 'Previous average score is required']
    },
    currentScore: {
        type: Number,
        required: [true, 'Current average score is required']
    },
    detectedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Resolved'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Ensure we don't spam duplicate alerts for the same course in the same session
alertSchema.index({ courseId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Alert', alertSchema);
