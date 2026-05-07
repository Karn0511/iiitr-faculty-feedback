const csv = require('csv-parser');
const { Readable } = require('stream');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const FeedbackSession = require('../models/FeedbackSession');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// ============================================================
// UPLOAD STUDENT DATA — CSV Bulk Ingestion
//
// Expected CSV columns (case-insensitive, whitespace-trimmed):
//   Name, Email, RollNo, Section, Semester, phone (optional)
//
// Default password = IIITR@2026
// The User.pre('save') hook hashes this before insertion.
//
// Uses insertMany with ordered:false so that duplicate emails/roll numbers
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
            const rollNo = row.rollno?.trim();
            const section = row.section?.trim();
            const semesterStr = row.semester?.trim();

            if (!email || !name || !rollNo || !section || !semesterStr) {
                errors.push({
                    row:     index + 2, // +2 for 1-index and header row
                    email:   email || 'missing',
                    reason:  'Missing required field(s): Name, Email, RollNo, Section, or Semester'
                });
                continue;
            }

            const semester = parseInt(semesterStr, 10);
            if (isNaN(semester)) {
                errors.push({
                    row:     index + 2,
                    email,
                    reason:  'Semester must be a valid number'
                });
                continue;
            }

            usersToInsert.push({
                name,
                email,
                rollNo,
                section,
                semester,
                phone:    row.phone?.trim() || undefined,
                role:     'Student',
                // Auto-Password Generation
                password: 'IIITR@2026'
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
        // Step 4: Handle partial MongoDB BulkWrite failures (duplicate emails / roll numbers)
        if (error.name === 'MongoBulkWriteError') {
            const inserted = error.result?.insertedCount || 0;
            const dupes    = (error.writeErrors || []).map(e => ({
                email:  e.err?.op?.email || 'unknown',
                reason: e.err?.errmsg || 'Duplicate email or roll number'
            }));

            return res.status(207).json({ // 207 Multi-Status: partial success
                success:         false,
                message:         'Partial upload complete. Some records were skipped due to duplicates.',
                total:           rows.length,
                inserted,
                duplicates:      dupes,
                hint:            'All unique records were inserted. Listed emails/roll numbers already had accounts.'
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
// UPLOAD COURSE + ASSIGNMENT DATA — CSV Bulk Ingestion (Relational Linker)
//
// Expected CSV columns: facultyEmail, courseCode, section, semester
// Finds the respective IDs and creates the Assignment entry.
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
            const { facultyemail, coursecode, section, semester } = row;

            if (!facultyemail || !coursecode || !section || !semester) {
                errors.push({ row: index + 2, reason: 'Missing required field(s): facultyEmail, courseCode, section, or semester' });
                continue;
            }

            const parsedSemester = parseInt(semester.trim(), 10);
            if (isNaN(parsedSemester)) {
                errors.push({ row: index + 2, reason: 'Semester must be a valid number' });
                continue;
            }

            try {
                // Find course by courseCode
                const course = await Course.findOne({ courseCode: coursecode.trim().toUpperCase() });

                if (!course) {
                    errors.push({ row: index + 2, reason: `Course not found for code: ${coursecode}` });
                    continue;
                }

                // Find the faculty user
                const faculty = await User.findOne({
                    email: facultyemail.trim().toLowerCase(),
                    role: 'Faculty'
                });

                if (!faculty) {
                    errors.push({ row: index + 2, reason: `Faculty not found for email: ${facultyemail}` });
                    continue;
                }

                // Upsert Assignment (faculty → course → section → semester mapping)
                await Assignment.findOneAndUpdate(
                    { facultyId: faculty._id, courseId: course._id, section: section.trim(), semester: parsedSemester },
                    { facultyId: faculty._id, courseId: course._id, section: section.trim(), semester: parsedSemester },
                    { upsert: true, new: true }
                );

                inserted++;
            } catch (rowErr) {
                errors.push({ row: index + 2, reason: rowErr.message });
            }
        }

        return res.status(201).json({
            success:  true,
            message:  'Course-assignment upload complete via Relational Linker.',
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

// ============================================================
// GET GLOBAL STATS — Institute-wide dashboard metrics
// Route:    GET /api/admin/stats
// Protected: Admin only (restrictTo enforced in routes/admin.js)
// ============================================================
exports.getGlobalStats = async (req, res) => {
    try {
        const Feedback = require('../models/Feedback');

        // Run all counts in parallel for performance
        const [totalStudents, totalFaculty, totalFeedback, scoreResult] = await Promise.all([
            User.countDocuments({ role: 'Student' }),
            User.countDocuments({ role: 'Faculty' }),
            Feedback.countDocuments(),

            // Institute-wide average score across ALL ratings
            Feedback.aggregate([
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id:          null,
                        averageScore: { $avg: '$ratings.score' },
                        totalRatings: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id:          0,
                        averageScore: { $round: ['$averageScore', 2] },
                        totalRatings: 1
                    }
                }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalFaculty,
                totalFeedback,
                averageInstituteScore: scoreResult[0]?.averageScore ?? null,
                totalRatings:          scoreResult[0]?.totalRatings  ?? 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET FACULTY LEADERBOARD — Ranked by average score
// Route:    GET /api/admin/leaderboard
// Protected: Admin only (restrictTo enforced in routes/admin.js)
//
// Aggregation pipeline:
//   S1 $unwind  — flatten ratings array
//   S2 $group   — avg score + unique response count per faculty
//   S3 $lookup  — enrich with faculty name/email from users collection
//   S4 $unwind  — flatten the lookup result
//   S5 $project — clean, strip internal IDs
//   S6 $sort    — highest average first
//   S7 $limit   — top 50 results
// ============================================================
exports.getFacultyLeaderboard = async (req, res) => {
    try {
        const Feedback = require('../models/Feedback');

        const leaderboard = await Feedback.aggregate([
            // S1: Flatten all rating entries
            { $unwind: '$ratings' },

            // S2: Compute avg score and unique feedback count per faculty
            {
                $group: {
                    _id:            '$facultyId',
                    averageScore:   { $avg: '$ratings.score' },
                    uniqueFeedback: { $addToSet: '$_id' }, // dedup submission count
                    totalRatings:   { $sum: 1 }
                }
            },

            // S3: Join User collection for faculty name and email
            {
                $lookup: {
                    from:         'users',
                    localField:   '_id',
                    foreignField: '_id',
                    as:           'facultyInfo'
                }
            },

            // S4: Flatten the join result
            { $unwind: '$facultyInfo' },

            // S5: Clean projection — no internal IDs exposed
            {
                $project: {
                    _id:            0,
                    facultyId:      '$_id',
                    name:           '$facultyInfo.name',
                    email:          '$facultyInfo.email',
                    averageScore:   { $round: ['$averageScore', 2] },
                    totalResponses: { $size: '$uniqueFeedback' },
                    totalRatings:   1
                }
            },

            // S6: Best-rated faculty first
            { $sort: { averageScore: -1 } },

            // S7: Top 50 only
            { $limit: 50 }
        ]);

        // Add rank numbers post-aggregation
        const ranked = leaderboard.map((entry, index) => ({
            rank: index + 1,
            ...entry
        }));

        res.status(200).json({
            success: true,
            count:   ranked.length,
            data:    { leaderboard: ranked }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// QUESTIONNAIRE MANAGEMENT
// Admins manage the question bank. Questions are never deleted
// (isActive toggle) to preserve historical feedback integrity.
// ============================================================

// ADD QUESTION
// Route: POST /api/admin/questions
exports.addQuestion = async (req, res) => {
    try {
        const { questionText } = req.body;

        if (!questionText || !questionText.trim()) {
            return res.status(400).json({
                success: false,
                message: 'questionText is required and cannot be empty.'
            });
        }

        const Questionnaire = require('../models/Questionnaire');
        const question = await Questionnaire.create({
            questionText: questionText.trim(),
            isActive:     true
        });

        res.status(201).json({
            success: true,
            message: 'Question added successfully.',
            data:    { question }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// TOGGLE QUESTION ACTIVE/INACTIVE
// Route: PATCH /api/admin/questions/:id
// Soft-toggle: preserves historical data integrity.
// Deactivated questions are excluded from new feedback forms
// but their past ratings remain valid for analytics.
exports.toggleQuestion = async (req, res) => {
    try {
        const { id }        = req.params;
        const Questionnaire = require('../models/Questionnaire');

        const question = await Questionnaire.findById(id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found.'
            });
        }

        question.isActive = !question.isActive;
        await question.save();

        res.status(200).json({
            success: true,
            message: `Question is now ${question.isActive ? '✅ Active' : '⛔ Inactive'}.`,
            data:    { question }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET ALL QUESTIONS (active and inactive)
// Route: GET /api/admin/questions
// Optional query: ?active=true|false
exports.getAllQuestions = async (req, res) => {
    try {
        const Questionnaire = require('../models/Questionnaire');
        const filter        = {};

        if (req.query.active !== undefined) {
            filter.isActive = req.query.active === 'true';
        }

        const questions = await Questionnaire.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count:   questions.length,
            data:    { questions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GEMINI AI DATA STRUCTURER
// ============================================================
exports.processAIIngest = async (req, res) => {
    try {
        const { text, type } = req.body;

        if (!text || !type) {
            return res.status(400).json({ success: false, message: 'Text and type (students, faculty, assignments) are required.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured on the server.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        let promptSchema = '';
        if (type === 'students') {
            promptSchema = '[{"name": "...", "email": "...", "rollNo": "...", "section": "...", "semester": 1}]';
        } else if (type === 'faculty') {
            promptSchema = '[{"name": "...", "email": "..."}]';
        } else if (type === 'assignments') {
            promptSchema = '[{"facultyEmail": "...", "courseCode": "...", "section": "...", "semester": 1}]';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid ingestion type.' });
        }

        const prompt = `You are a strict data structuring assistant. I will give you messy raw text containing data.
Extract all individual records and format them exactly as a JSON array matching this schema: ${promptSchema}.
Do not include markdown blocks, explanations, or any other text. Return ONLY the raw JSON array.
If fields like section or semester are missing but logically implied, deduce them. Otherwise leave string fields blank and number fields as 0.

Raw text to process:
${text}`;

        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();
        
        // Clean markdown backticks if Gemini includes them
        if (rawResponse.startsWith('\`\`\`json')) {
            rawResponse = rawResponse.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (rawResponse.startsWith('\`\`\`')) {
            rawResponse = rawResponse.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawResponse);
        } catch (parseErr) {
            console.error('Failed to parse Gemini output:', rawResponse);
            return res.status(500).json({ success: false, message: 'AI failed to return valid JSON.', raw: rawResponse });
        }

        res.status(200).json({
            success: true,
            data: parsedData
        });
    } catch (error) {
        console.error('Gemini AI error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// BULK JSON UPLOAD (After AI Finalization)
// ============================================================
exports.uploadBulkJSON = async (req, res) => {
    try {
        const { type } = req.params;
        const { data } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty data array.' });
        }

        const errors = [];
        const usersToInsert = [];
        let inserted = 0;

        if (type === 'students') {
            for (const [index, row] of data.entries()) {
                const email = row.email?.trim().toLowerCase();
                const name  = row.name?.trim();
                const rollNo = row.rollNo?.trim();
                const section = row.section?.trim();
                const semester = parseInt(row.semester, 10);

                if (!email || !name || !rollNo || !section || isNaN(semester)) {
                    errors.push({ row: index + 1, reason: 'Missing or invalid fields' });
                    continue;
                }

                usersToInsert.push({ name, email, rollNo, section, semester, role: 'Student', password: 'IIITR@2026' });
            }

            if (usersToInsert.length > 0) {
                try {
                    const result = await User.insertMany(usersToInsert, { ordered: false });
                    inserted = result.length;
                } catch (e) {
                    if (e.name === 'MongoBulkWriteError') inserted = e.result?.insertedCount || 0;
                    else throw e;
                }
            }

        } else if (type === 'faculty') {
            for (const [index, row] of data.entries()) {
                const email = row.email?.trim().toLowerCase();
                const name  = row.name?.trim();

                if (!email || !name) {
                    errors.push({ row: index + 1, reason: 'Missing name or email' });
                    continue;
                }

                usersToInsert.push({ name, email, role: 'Faculty', password: email.split('@')[0] });
            }

            if (usersToInsert.length > 0) {
                try {
                    const result = await User.insertMany(usersToInsert, { ordered: false });
                    inserted = result.length;
                } catch (e) {
                    if (e.name === 'MongoBulkWriteError') inserted = e.result?.insertedCount || 0;
                    else throw e;
                }
            }

        } else if (type === 'assignments') {
            for (const [index, row] of data.entries()) {
                const { facultyEmail, courseCode, section, semester } = row;

                if (!facultyEmail || !courseCode || !section || isNaN(parseInt(semester, 10))) {
                    errors.push({ row: index + 1, reason: 'Missing required assignment fields' });
                    continue;
                }

                const parsedSemester = parseInt(semester, 10);
                const course = await Course.findOne({ courseCode: courseCode.trim().toUpperCase() });
                if (!course) { errors.push({ row: index + 1, reason: `Course not found: ${courseCode}` }); continue; }

                const faculty = await User.findOne({ email: facultyEmail.trim().toLowerCase(), role: 'Faculty' });
                if (!faculty) { errors.push({ row: index + 1, reason: `Faculty not found: ${facultyEmail}` }); continue; }

                await Assignment.findOneAndUpdate(
                    { facultyId: faculty._id, courseId: course._id, section: section.trim(), semester: parsedSemester },
                    { facultyId: faculty._id, courseId: course._id, section: section.trim(), semester: parsedSemester },
                    { upsert: true, new: true }
                );
                inserted++;
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid upload type.' });
        }

        res.status(201).json({
            success: true,
            message: `JSON Bulk upload complete.`,
            total: data.length,
            inserted,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// DOWNLOAD CSV TEMPLATE FILE
// ============================================================
exports.downloadTemplateFile = (req, res) => {
    try {
        const { filename } = req.params;
        let csvContent = '';

        if (filename === 'students_template.csv') {
            csvContent = 'Name,Email,RollNo,Section,Semester\r\n';
        } else if (filename === 'faculty_template.csv') {
            csvContent = 'Name,Email\r\n';
        } else if (filename === 'assignments_template.csv') {
            csvContent = 'FacultyEmail,CourseCode,Section,Semester\r\n';
        } else {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csvContent);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
