const express  = require('express');
const router   = express.Router();
const { protect, restrictTo }       = require('../middlewares/authMiddleware');
const { checkSessionActive }        = require('../middlewares/sessionMiddleware');
const { validateFeedback }          = require('../middlewares/inputValidator');
const studentController             = require('../controllers/studentController');

// All student routes require authentication + Student role
router.use(protect);
router.use(restrictTo('Student'));

// ============================================================
// COURSE DISCOVERY
// GET /api/student/courses
// Returns all courses for this student's section with
// feedbackSubmitted flag so UI can grey out done items
// ============================================================
router.get('/courses', studentController.getAvailableCourses);

// ============================================================
// FEEDBACK SUBMISSION — With input validation
// POST /api/student/feedback
// checkSessionActive must pass before any submission is allowed
// ============================================================
router.post('/feedback',
    checkSessionActive,       // Gate: is the window open?
    validateFeedback,         // OWASP A03: validate all inputs
    studentController.submitFeedback
);

// ============================================================
// SUBMISSION STATUS
// GET /api/student/feedback/status
// Shows which courses the student has already submitted for
// ============================================================
router.get('/feedback/status', studentController.getSubmissionStatus);

// ============================================================
// QUESTIONNAIRE ROUTE FOR STUDENTS
// GET /api/student/questions
// ============================================================
router.get('/questions', studentController.getQuestions);

module.exports = router;
