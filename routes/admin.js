const express  = require('express');
const router   = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const upload   = require('../middlewares/uploadMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require authentication + Admin role
router.use(protect);
router.use(restrictTo('Admin'));

// ============================================================
// DATA INGESTION ROUTES
// ============================================================

// POST /api/admin/upload/students
// Body: multipart/form-data with field 'file' (CSV)
router.post('/upload/students',
    upload.single('file'),
    adminController.uploadStudentData
);

// POST /api/admin/upload/faculty
router.post('/upload/faculty',
    upload.single('file'),
    adminController.uploadFacultyData
);

// POST /api/admin/upload/assignments
router.post('/upload/assignments',
    upload.single('file'),
    adminController.uploadCourseAssignments
);

// ============================================================
// FEEDBACK SESSION MANAGEMENT
// ============================================================

// POST   /api/admin/sessions           — create a new session
// GET    /api/admin/sessions           — list all sessions
// PATCH  /api/admin/sessions/:sessionId/toggle — open/close a session
router.post('/sessions',                        adminController.createFeedbackSession);
router.get('/sessions',                         adminController.getAllSessions);
router.patch('/sessions/:sessionId/toggle',     adminController.toggleFeedbackSession);

// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/admin/users?role=Student|Faculty|Admin
router.get('/users', adminController.getAllUsers);

module.exports = router;
