const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Faculty ID is required']
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        trim: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate assignments for the same section and course
assignmentSchema.index({ facultyId: 1, courseId: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
