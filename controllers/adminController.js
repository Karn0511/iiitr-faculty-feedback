const csv = require('csv-parser');
const { Readable } = require('stream');
const User = require('../models/User');
const FeedbackSession = require('../models/FeedbackSession');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// ============================================================
// UPLOAD STUDENT DATA — CSV Bulk Ingestion
//
// Expected CSV columns (case-insensitive, whitespace-trimmed):
//   name, email, phone (optional), section
//
// Default password = email local-part (before '@')
// e.g. email: b21cs001@iiitranchi.ac.in → password: "b21cs001"
// The User.pre('save') hook hashes this before insertion.
//
// Uses insertMany with ordered:false so that duplicate emails
// are skipped without aborting the rest of the batch.
// Returns 207 Multi-Status on partial success.
// ============================================================
exports.uploadStudentData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No CSV file was uploaded.' });
    }

    const rows   = [];
    const errors = [];

    try {
        // Step 1: Parse the in-memory Buffer → JSON rows via csv-parser
        await new Promise((resolve, reject) => {
            Readable.from(req.file.buffer.toString('utf-8'))
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().toLowerCase() // normalize headers
                }))
                .on('data', (row) => rows.push(row))
                .on('end',  resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is empty or contains no valid rows.'
            });
        }

        // Step 2: Validate and map rows to User documents
        const usersToInsert = [];

        for (const [index, row] of rows.entries()) {
            const email = row.email?.trim().toLowerCase();
            const name  = row.name?.trim();
            const section = row.section?.trim();

            if (!email || !name || !section) {
                errors.push({
                    row:     index + 2, // +2 for 1-index and header row
                    email:   email || 'missing',
                    reason:  'Missing required field(s): name, email, or section'
                });
                continue;
            }

            usersToInsert.push({
                name,
                email,
                phone:    row.phone?.trim() || undefined,
                role:     'Student',
                section,
                // Default password = email local-part
                // bcrypt pre-save hook handles hashing automatically
                password: email.split('@')[0]
            });
        }

        if (usersToInsert.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid rows found in the CSV.',
                validationErrors: errors
            });
        }

        // Step 3: Bulk insert — ordered:false continues on duplicate key errors
        const insertResult = await User.insertMany(usersToInsert, { ordered: false });

        return res.status(201).json({
            success:          true,
            message:          'Bulk upload complete.',
            total:            rows.length,
            inserted:         insertResult.length,
            skipped:          rows.length - insertResult.length - errors.length,
            validationErrors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        // Step 4: Handle partial MongoDB BulkWrite failures (duplicate emails)
        if (error.name === 'MongoBulkWriteError') {
            const inserted = error.result?.insertedCount || 0;
            const dupes    = (error.writeErrors || []).map(e => ({
                email:  e.err?.op?.email || 'unknown',
                reason: 'Email already exists in the database'
            }));

            return res.status(207).json({ // 207 Multi-Status: partial success
                success:         false,
                message:         'Partial upload complete. Some records were skipped due to duplicates.',
                total:           rows.length,
                inserted,
                duplicates:      dupes,
                hint:            'All unique records were inserted. Listed emails already had accounts.'
            });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// UPLOAD FACULTY DATA — CSV Bulk Ingestion
//
// Expected CSV columns: name, email, phone (optional)
// Default password = email local-part
// ============================================================
exports.uploadFacultyData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No CSV file was uploaded.' });
    }

    const rows   = [];
    const errors = [];

    try {
        await new Promise((resolve, reject) => {
            Readable.from(req.file.buffer.toString('utf-8'))
                .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
                .on('data', (row) => rows.push(row))
                .on('end',  resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'CSV file is empty.' });
        }

        const usersToInsert = [];

        for (const [index, row] of rows.entries()) {
            const email = row.email?.trim().toLowerCase();
            const name  = row.name?.trim();

            if (!email || !name) {
                errors.push({ row: index + 2, email: email || 'missing', reason: 'Missing name or email' });
                continue;
            }

            usersToInsert.push({
                name,
                email,
                phone:    row.phone?.trim() || undefined,
                role:     'Faculty',
                password: email.split('@')[0]
            });
        }

        const insertResult = await User.insertMany(usersToInsert, { ordered: false });

        return res.status(201).json({
            success:          true,
            message:          'Faculty bulk upload complete.',
            total:            rows.length,
            inserted:         insertResult.length,
            validationErrors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        if (error.name === 'MongoBulkWriteError') {
            const inserted = error.result?.insertedCount || 0;
            const dupes    = (error.writeErrors || []).map(e => ({
                email: e.err?.op?.email || 'unknown', reason: 'Duplicate email'
            }));
            return res.status(207).json({
                success: false, message: 'Partial faculty upload.', inserted, duplicates: dupes
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// UPLOAD COURSE + ASSIGNMENT DATA — CSV Bulk Ingestion
//
// Expected CSV columns: courseName, courseCode, facultyEmail, section
// Creates Course records and maps them to Assignment records.
// ============================================================
exports.uploadCourseAssignments = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No CSV file was uploaded.' });
    }

    const rows   = [];
    const errors = [];
    let   inserted = 0;

    try {
        await new Promise((resolve, reject) => {
            Readable.from(req.file.buffer.toString('utf-8'))
                .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
                .on('data', (row) => rows.push(row))
                .on('end',  resolve)
                .on('error', reject);
        });

        for (const [index, row] of rows.entries()) {
            const { coursename, coursecode, facultyemail, section } = row;

            if (!coursename || !coursecode || !facultyemail || !section) {
                errors.push({ row: index + 2, reason: 'Missing required fields' });
                continue;
            }

            try {
                // Upsert Course
                const course = await Course.findOneAndUpdate(
                    { courseCode: coursecode.trim().toUpperCase() },
                    { courseName: coursename.trim(), courseCode: coursecode.trim().toUpperCase() },
                    { upsert: true, new: true }
                );

                // Find the faculty user
                const faculty = await User.findOne({
                    email: facultyemail.trim().toLowerCase(),
                    role: 'Faculty'
                });

                if (!faculty) {
                    errors.push({ row: index + 2, reason: `Faculty not found: ${facultyemail}` });
                    continue;
                }

                // Upsert Assignment (faculty → course → section mapping)
                await Assignment.findOneAndUpdate(
                    { facultyId: faculty._id, courseId: course._id, section: section.trim() },
                    { facultyId: faculty._id, courseId: course._id, section: section.trim() },
                    { upsert: true, new: true }
                );

                inserted++;
            } catch (rowErr) {
                errors.push({ row: index + 2, reason: rowErr.message });
            }
        }

        return res.status(201).json({
            success:  true,
            message:  'Course-assignment upload complete.',
            total:    rows.length,
            inserted,
            errors:   errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// CREATE FEEDBACK SESSION
// ============================================================
exports.createFeedbackSession = async (req, res) => {
    try {
        const { sessionName, startDate, endDate } = req.body;

        if (!sessionName || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'sessionName, startDate, and endDate are all required.'
            });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'startDate must be before endDate.'
            });
        }

        const session = await FeedbackSession.create({
            sessionName,
            startDate: new Date(startDate),
            endDate:   new Date(endDate),
            isOpen:    false // Admin opens it explicitly via toggle
        });

        res.status(201).json({
            success: true,
            message: 'Feedback session created successfully.',
            data:    { session }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// TOGGLE FEEDBACK SESSION OPEN/CLOSED
// ============================================================
exports.toggleFeedbackSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await FeedbackSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Feedback session not found.' });
        }

        // Flip the isOpen flag
        session.isOpen = !session.isOpen;
        await session.save();

        res.status(200).json({
            success: true,
            message: `Feedback session is now ${session.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}.`,
            data:    { session }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET ALL FEEDBACK SESSIONS
// ============================================================
exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await FeedbackSession.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: sessions.length, data: { sessions } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET ALL USERS (by role)
// ============================================================
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter   = role ? { role } : {};
        const users    = await User.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: { users } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
