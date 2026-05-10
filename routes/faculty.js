const express  = require('express');
const router   = express.Router();
const { protect, restrictTo }   = require('../middlewares/authMiddleware');
const facultyController         = require('../controllers/facultyController');

// All faculty routes require authentication + Faculty role
router.use(protect);
router.use(restrictTo('Faculty'));

// ============================================================
// DASHBOARD — Per-course aggregated stats
// GET /api/faculty/dashboard
// Full 8-stage pipeline: avg scores per question per course
// ============================================================
router.get('/dashboard', facultyController.getDashboardStats);

// ============================================================
// OVERALL SUMMARY — Single number across all courses
// GET /api/faculty/summary
// ============================================================
router.get('/summary', facultyController.getOverallSummary);

// ============================================================
// QUESTION TRENDS — Which questions this faculty scores best on
// GET /api/faculty/question-trends
// ============================================================
router.get('/question-trends', facultyController.getQuestionTrends);

// ============================================================
// REMARKS — Anonymized text feedback per course
// GET /api/faculty/remarks/:courseId
// studentId is explicitly excluded at the DB projection layer
// ============================================================
router.get('/remarks/:courseId', facultyController.getCourseRemarks);

module.exports = router;

