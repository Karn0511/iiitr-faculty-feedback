const FeedbackSession = require('../models/FeedbackSession');

// ============================================================
// CHECK SESSION ACTIVE
// Guards any route that should only be accessible during an
// open, in-window feedback session.
//
// Three-gate logic:
//   Gate 1 — No open session found            → 403
//   Gate 2 — Now is before session.startDate  → 403
//   Gate 3 — Now is after  session.endDate    → 403 + auto-closes session
//
// On pass: attaches req.activeSession for downstream controllers.
// ============================================================
exports.checkSessionActive = async (req, res, next) => {
    try {
        // Query the most recently created session that is marked open
        const session = await FeedbackSession.findOne({ isOpen: true })
            .sort({ createdAt: -1 });

        const now = new Date();

        // Gate 1: No open session at all
        if (!session) {
            return res.status(403).json({
                success: false,
                message: 'Feedback window is currently closed.'
            });
        }

        // Gate 2: Window hasn't started yet
        if (now < new Date(session.startDate)) {
            return res.status(403).json({
                success: false,
                message: 'Feedback window is currently closed.',
                detail:  `Session opens on ${new Date(session.startDate).toDateString()}`
            });
        }

        // Gate 3: Window has expired — auto-close it in the DB
        if (now > new Date(session.endDate)) {
            session.isOpen = false;
            await session.save();

            return res.status(403).json({
                success: false,
                message: 'Feedback window is currently closed.',
                detail:  `Session ended on ${new Date(session.endDate).toDateString()}`
            });
        }

        // All gates passed — attach session for downstream use
        req.activeSession = session;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying session status. Please try again.'
        });
    }
};
