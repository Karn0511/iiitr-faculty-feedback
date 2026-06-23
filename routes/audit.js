const express  = require('express');
const router   = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const AuditLog = require('../models/AuditLog');

// All audit routes require Admin authentication
router.use(protect);
router.use(restrictTo('Admin'));

// ============================================================
// GET /api/admin/audit-logs
// Admin-only: Search and filter audit logs
//
// Query parameters:
//   action    — Filter by action type (e.g., LOGIN_FAILED)
//   userId    — Filter by specific user
//   startDate — Filter from date (ISO string)
//   endDate   — Filter to date (ISO string)
//   page      — Pagination page (default: 1)
//   limit     — Results per page (default: 50, max: 200)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const {
            action,
            userId,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};

        if (action) filter.action = action;
        if (userId) filter.userId = userId;

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate)   filter.timestamp.$lte = new Date(endDate);
        }

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('userId', 'name email role')
                .lean(),
            AuditLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count:   logs.length,
            total,
            page:    pageNum,
            pages:   Math.ceil(total / limitNum),
            data:    { logs }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
