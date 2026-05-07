const mongoose = require('mongoose');

const feedbackSessionSchema = new mongoose.Schema({
    sessionName: {
        type: String,
        required: [true, 'Session name is required'],
        trim: true
    },
    isOpen: {
        type: Boolean,
        default: false
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FeedbackSession', feedbackSessionSchema);
