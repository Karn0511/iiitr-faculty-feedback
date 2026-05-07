const Feedback  = require('../models/Feedback');
const mongoose  = require('mongoose');

// ============================================================
// GET DASHBOARD STATS — 8-Stage Aggregation Pipeline
// Route:    GET /api/faculty/dashboard
// Protected: Faculty only
//
// Pipeline overview:
//  S1  $match   → isolate this faculty's feedback only
//  S2  $unwind  → flatten ratings array
//  S3  $group   → avg score per (courseId × questionId)
//  S4  $lookup  → join courses collection
//  S5  $lookup  → join questionnaires collection
//  S6  $group   → collapse question stats under each course
//  S7  $project → clean output, compute overallAverage, strip internals
//  S8  $sort    → best-rated courses first
// ============================================================
exports.getDashboardStats = async (req, res) => {
    try {
        const facultyId = new mongoose.Types.ObjectId(req.user.id);

        const pipeline = [
            // ─── STAGE 1: MATCH ───────────────────────────────────
            // Hard data-isolation: only this faculty's feedback enters the pipeline.
            // studentId is never referenced or propagated beyond this stage.
            {
                $match: { facultyId }
            },

            // ─── STAGE 2: UNWIND ──────────────────────────────────
            // Deconstruct the ratings array so each { questionId, score }
            // pair becomes its own pipeline document.
            {
                $unwind: '$ratings'
            },

            // ─── STAGE 3: GROUP ───────────────────────────────────
            // Compute the mathematical average score per course per question.
            // studentId is intentionally NOT accumulated — only scores are.
            {
                $group: {
                    _id: {
                        courseId:   '$courseId',
                        questionId: '$ratings.questionId'
                    },
                    averageScore:  { $avg: '$ratings.score' },
                    responseCount: { $sum: 1 }
                }
            },

            // ─── STAGE 4: LOOKUP — Course details ────────────────
            {
                $lookup: {
                    from:         'courses',
                    localField:   '_id.courseId',
                    foreignField: '_id',
                    as:           'courseInfo'
                }
            },
            { $unwind: '$courseInfo' },

            // ─── STAGE 5: LOOKUP — Question text ─────────────────
            {
                $lookup: {
                    from:         'questionnaires',
                    localField:   '_id.questionId',
                    foreignField: '_id',
                    as:           'questionInfo'
                }
            },
            { $unwind: '$questionInfo' },

            // ─── STAGE 6: GROUP — Collapse questions under course ─
            {
                $group: {
                    _id:          '$_id.courseId',
                    courseName:   { $first: '$courseInfo.courseName' },
                    courseCode:   { $first: '$courseInfo.courseCode' },
                    totalResponses: { $max: '$responseCount' },
                    questionStats: {
                        $push: {
                            questionId:    '$_id.questionId',
                            questionText:  '$questionInfo.questionText',
                            averageScore:  { $round: ['$averageScore', 2] },
                            responseCount: '$responseCount'
                        }
                    }
                }
            },

            // ─── STAGE 7: PROJECT ─────────────────────────────────
            // Strip all internal MongoDB IDs from the output.
            // Compute an overallAverage across all questions for this course.
            // studentId has never reached this stage — full anonymity maintained.
            {
                $project: {
                    _id:            0,
                    courseId:       '$_id',
                    courseName:     1,
                    courseCode:     1,
                    totalResponses: 1,
                    questionStats:  1,
                    overallAverage: {
                        $round: [{ $avg: '$questionStats.averageScore' }, 2]
                    }
                }
            },

            // ─── STAGE 8: SORT ────────────────────────────────────
            // Best-rated courses appear first
            {
                $sort: { overallAverage: -1 }
            }
        ];

        const stats = await Feedback.aggregate(pipeline);

        res.status(200).json({
            success: true,
            faculty: {
                id:   req.user.id,
                name: req.user.name,
                email:req.user.email
            },
            courseCount: stats.length,
            data: { stats }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET REMARKS — Anonymized text feedback
// Route:    GET /api/faculty/remarks/:courseId
// Protected: Faculty only
//
// CRITICAL ANONYMITY:
//   studentId is explicitly projected OUT using { studentId: 0 }.
//   _id is also suppressed. Faculty sees only the text + timestamp.
// ============================================================
exports.getCourseRemarks = async (req, res) => {
    try {
        const { courseId } = req.params;
        const facultyId    = req.user.id;

        const remarks = await Feedback.find(
            {
                facultyId,
                courseId,
                remark: { $exists: true, $ne: '' }
            },
            {
                remark:    1,
                createdAt: 1,
                _id:       0,  // Suppress document ID
                studentId: 0   // CRITICAL: explicitly exclude studentId
            }
        ).lean();

        res.status(200).json({
            success: true,
            count:   remarks.length,
            data:    { remarks }
            // Each remark object: { remark: "...", createdAt: "..." }
            // No student identifier is ever present
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET OVERALL SUMMARY — Single aggregate across all courses
// Route:    GET /api/faculty/summary
// Protected: Faculty only
// ============================================================
exports.getOverallSummary = async (req, res) => {
    try {
        const facultyId = new mongoose.Types.ObjectId(req.user.id);

        const [summary] = await Feedback.aggregate([
            // Stage 1: Isolate this faculty
            { $match: { facultyId } },

            // Stage 2: Flatten ratings
            { $unwind: '$ratings' },

            // Stage 3: Single-group global stats
            {
                $group: {
                    _id:           null,
                    overallAvg:    { $avg: '$ratings.score' },
                    // Deduplicate feedback _ids to get true submission count
                    uniqueFeedback:{ $addToSet: '$_id' }
                }
            },

            // Stage 4: Clean output
            {
                $project: {
                    _id:            0,
                    overallAverage: { $round: ['$overallAvg', 2] },
                    totalResponses: { $size: '$uniqueFeedback' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data:    summary || { overallAverage: null, totalResponses: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// GET PER-QUESTION TREND (across all courses combined)
// Route:    GET /api/faculty/question-trends
// Useful for faculty to see which question type they score best on
// ============================================================
exports.getQuestionTrends = async (req, res) => {
    try {
        const facultyId = new mongoose.Types.ObjectId(req.user.id);

        const trends = await Feedback.aggregate([
            { $match: { facultyId } },
            { $unwind: '$ratings' },
            {
                $group: {
                    _id:          '$ratings.questionId',
                    averageScore: { $avg: '$ratings.score' },
                    totalAnswers: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'questionnaires', localField: '_id',
                    foreignField: '_id', as: 'questionInfo'
                }
            },
            { $unwind: '$questionInfo' },
            {
                $project: {
                    _id:          0,
                    questionId:   '$_id',
                    questionText: '$questionInfo.questionText',
                    averageScore: { $round: ['$averageScore', 2] },
                    totalAnswers: 1
                }
            },
            { $sort: { averageScore: -1 } }
        ]);

        res.status(200).json({ success: true, count: trends.length, data: { trends } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
