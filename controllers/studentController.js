const Feedback      = require('../models/Feedback');
const Assignment    = require('../models/Assignment');

// ============================================================
// SUBMIT FEEDBACK (One-attempt enforced)
// Route:    POST /api/student/feedback
// Requires: protect, restrictTo('Student'), checkSessionActive
// ============================================================
exports.submitFeedback = async (req, res) => {
    try {
        const { courseId, facultyId, ratings, remark } = req.body;
        const studentId = req.user.id;

        // --- BASIC VALIDATION ---
        if (!courseId || !facultyId || !ratings || !Array.isArray(ratings) || ratings.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'courseId, facultyId, and a non-empty ratings array are required.'
            });
        }

        // --- LOCKOUT CHECK (Application layer) ---
        // The compound unique index on Feedback is the DB-layer safety net.
        // This explicit check returns a human-readable error before hitting Mongo.
        const existingFeedback = await Feedback.findOne({ studentId, courseId, facultyId });

        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: 'Feedback already submitted for this course. Only one submission is permitted.'
            });
        }

        // --- ASSIGNMENT VERIFICATION ---
        // Ensure the faculty-course-section mapping is valid for this student.
        // A student cannot submit feedback for a faculty they don't study under.
        const validAssignment = await Assignment.findOne({
            facultyId,
            courseId,
            section: req.user.section
        });

        if (!validAssignment) {
            return res.status(403).json({
                success: false,
                message: 'This faculty-course combination is not assigned to your section.'
            });
        }

        // --- SCORE BOUNDARY VALIDATION ---
        const invalidScore = ratings.find(r => r.score < 1 || r.score > 10);
        if (invalidScore) {
            return res.status(400).json({
                success: false,
                message: 'All scores must be integers between 1 and 10.'
            });
        }

        // --- SAVE FEEDBACK ---
        // studentId is stored silently for duplicate-checking only.
        // It is never returned or exposed to faculty/admin.
        const feedback = await Feedback.create({
            courseId,
            facultyId,
            studentId,
            ratings,
            remark: remark?.trim() || undefined
        });

        res.status(201).json({
            success:     true,
            message:     'Feedback submitted successfully. Thank you!',
            data: {
                submissionId: feedback._id,
                submittedAt:  feedback.createdAt
                // studentId deliberately omitted
            }
        });

    } catch (error) {
        // DB-layer duplicate key — compound index catches concurrent race conditions
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Feedback already submitted for this course.'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET SUBMISSION STATUS
// Returns which course+faculty pairs the student has submitted for.
// Route: GET /api/student/feedback/status
// ============================================================
exports.getSubmissionStatus = async (req, res) => {
    try {
        const submissions = await Feedback.find(
            { studentId: req.user.id },
            { courseId: 1, facultyId: 1, createdAt: 1 }  // studentId excluded from projection
        )
            .populate('courseId',  'courseName courseCode')
            .populate('facultyId', 'name')
            .lean();

        res.status(200).json({
            success: true,
            count:   submissions.length,
            data:    { submissions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET AVAILABLE COURSES FOR FEEDBACK
// Lists all courses assigned to the student's section.
// Each item includes feedbackSubmitted: true/false so the
// frontend can grey out already-completed entries.
// Route: GET /api/student/courses
// ============================================================
exports.getAvailableCourses = async (req, res) => {
    try {
        // Safe-guard check: Ensure student is assigned to a section and semester
        if (!req.user.section || !req.user.semester) {
            return res.status(200).json({
                success: true,
                count:   0,
                data:    { courses: [] },
                message: 'No section or semester assigned. Please contact the administrator.'
            });
        }

        // All faculty-course-section-semester assignments matching student's assignment exactly
        const assignments = await Assignment.find({ section: req.user.section, semester: req.user.semester })
            .populate('courseId',  'courseName courseCode')
            .populate('facultyId', 'name email avatar')
            .lean();

        // All prior submissions by this student
        const submitted = await Feedback.find(
            { studentId: req.user.id },
            { courseId: 1, facultyId: 1 }
        ).lean();

        // Build a lookup Set of "courseId_facultyId" keys
        const submittedKeys = new Set(
            submitted.map(f => `${f.courseId}_${f.facultyId}`)
        );

        const courses = assignments.map(a => ({
            assignmentId:      a._id,
            course:            a.courseId,
            faculty:           a.facultyId,
            section:           a.section,
            feedbackSubmitted: submittedKeys.has(`${a.courseId._id}_${a.facultyId._id}`)
        }));

        res.status(200).json({
            success: true,
            count:   courses.length,
            data:    { courses }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET ACTIVE QUESTIONS FOR EVALUATION
// Lists all active questions for the student evaluation form.
// Route: GET /api/student/questions
// ============================================================
exports.getQuestions = async (req, res) => {
    try {
        const Questionnaire = require('../models/Questionnaire');
        const questions = await Questionnaire.find({ isActive: true }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count:   questions.length,
            data:    { questions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
