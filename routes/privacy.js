const express = require('express');
const router  = express.Router();
const { protect, restrictTo, requireSudo } = require('../middlewares/authMiddleware');
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
//   DELETE /api/privacy/my-data       — Right to Erasure (REQUIRES SUDO)
//   GET    /api/privacy/data-export   — Data Portability (REQUIRES SUDO)
//   POST   /api/privacy/consent       — Grant consent
//   GET    /api/privacy/consent       — Check consent status
//   DELETE /api/privacy/consent       — Withdraw consent
//   GET    /api/privacy/security-events — Personal security logs
// ============================================================

// --- PUBLIC ENDPOINTS ---
router.get('/notice',    privacyController.getPrivacyNotice);
router.get('/grievance', privacyController.getGrievanceInfo);

// --- PROTECTED ENDPOINTS ---
router.use(protect);  // All routes below require authentication

// Data Principal Rights (Protected behind Sudo Mode for export/erasure)
router.get('/my-data',       privacyController.getMyData);
router.put('/my-data',       privacyController.updateMyData);
router.delete('/my-data',    requireSudo, privacyController.eraseMyData);
router.get('/data-export',   requireSudo, privacyController.exportMyData);

// Personal Security Overview (Google/Stripe Standards)
router.get('/security-events', privacyController.getMySecurityEvents);

// Consent Management
router.post('/consent',      validateConsent, privacyController.giveConsent);
router.get('/consent',       privacyController.getConsentStatus);
router.delete('/consent',    privacyController.withdrawConsent);

module.exports = router;
