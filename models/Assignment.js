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
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required']
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate assignments for the same section, course, and semester
assignmentSchema.index({ facultyId: 1, courseId: 1, section: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
