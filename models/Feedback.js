const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Faculty ID is required']
    },
    // CRITICAL: This is for backend duplicate-checking only. 
    // It should not be exposed to faculty or admin in the frontend to maintain anonymity.
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    ratings: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Questionnaire',
            required: [true, 'Question ID is required']
        },
        score: {
            type: Number,
            required: [true, 'Score is required'],
            min: [1, 'Score must be at least 1'],
            max: [10, 'Score cannot exceed 10']
        }
    }],
    remark: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Prevent a student from submitting feedback multiple times for the same course and faculty
feedbackSchema.index({ courseId: 1, facultyId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
