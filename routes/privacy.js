const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validateConsent }     = require('../middlewares/inputValidator');
const privacyController       = require('../controllers/privacyController');

// ============================================================
// DPDP ACT 2023 — PRIVACY ROUTES
//
// Public endpoints (no auth required):
//   GET /api/privacy/notice       — Current privacy notice
//   GET /api/privacy/grievance    — Grievance officer info
//
// Protected endpoints (auth required):
//   GET    /api/privacy/my-data       — Right to Access
//   PUT    /api/privacy/my-data       — Right to Correction
//   DELETE /api/privacy/my-data       — Right to Erasure
//   GET    /api/privacy/data-export   — Data Portability
//   POST   /api/privacy/consent       — Grant consent
//   GET    /api/privacy/consent       — Check consent status
//   DELETE /api/privacy/consent       — Withdraw consent
// ============================================================

// --- PUBLIC ENDPOINTS ---
router.get('/notice',    privacyController.getPrivacyNotice);
router.get('/grievance', privacyController.getGrievanceInfo);

// --- PROTECTED ENDPOINTS ---
router.use(protect);  // All routes below require authentication

// Data Principal Rights
router.get('/my-data',       privacyController.getMyData);
router.put('/my-data',       privacyController.updateMyData);
router.delete('/my-data',    privacyController.eraseMyData);
router.get('/data-export',   privacyController.exportMyData);

// Consent Management
router.post('/consent',      validateConsent, privacyController.giveConsent);
router.get('/consent',       privacyController.getConsentStatus);
router.delete('/consent',    privacyController.withdrawConsent);

module.exports = router;
