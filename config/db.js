const mongoose = require('mongoose');

// strictQuery must be set globally in Mongoose 7+/8+/9+
mongoose.set('strictQuery', true);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);

        // Seed sample users
        const User = require('../models/User');
        const adminEmail = 'admin@iiitranchi.ac.in';
        const facultyEmail = 'faculty@iiitranchi.ac.in';
        const studentEmail = 'student@iiitranchi.ac.in';

        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: 'admin123',
                role: 'Admin',
                isActive: true
            });
            console.log(`🌱 Seeded Admin user: ${adminEmail}`);
        } else {
            // Update password to be simple as requested
            adminExists.password = 'admin123';
            await adminExists.save();
        }

        const facultyExists = await User.findOne({ email: facultyEmail });
        if (!facultyExists) {
            await User.create({
                name: 'Dr. Amit Kumar',
                email: facultyEmail,
                password: 'faculty123',
                role: 'Faculty',
                isActive: true
            });
            console.log(`🌱 Seeded Faculty user: ${facultyEmail}`);
        } else {
            // Update password to be simple as requested
            facultyExists.password = 'faculty123';
            await facultyExists.save();
        }

        const studentExists = await User.findOne({ email: studentEmail });
        if (!studentExists) {
            await User.create({
                name: 'Karn Ashutosh',
                email: studentEmail,
                password: 'student123',
                role: 'Student',
                section: 'A',
                rollNo: '2026-CS-42',
                semester: 4,
                isActive: true
            });
            console.log(`🌱 Seeded Student user: ${studentEmail}`);
        } else {
            // Update password to be simple as requested and ensure required fields are populated
            studentExists.password = 'student123';
            studentExists.rollNo = studentExists.rollNo || '2026-CS-42';
            studentExists.semester = studentExists.semester || 4;
            await studentExists.save();
        }

        // Seed active questions
        const Questionnaire = require('../models/Questionnaire');
        const qCount = await Questionnaire.countDocuments();
        if (qCount === 0) {
            await Questionnaire.create([
                { questionText: 'Subject Knowledge & Preparation' },
                { questionText: 'Communication & Explanation Clarity' },
                { questionText: 'Syllabus Coverage & Punctuality' },
                { questionText: 'Accessibility for Doubt Solving' }
            ]);
            console.log('🌱 Seeded 4 standard Questionnaire questions.');
        }

        // Seed course
        const Course = require('../models/Course');
        let course = await Course.findOne({ courseCode: 'CS101' });
        if (!course) {
            course = await Course.create({
                courseName: 'Computer Programming & Data Structures',
                courseCode: 'CS101'
            });
            console.log('🌱 Seeded Course: CS101');
        }

        // Seed Assignment connecting Dr. Amit Kumar (Faculty) to Course CS101 for Section A
        const Assignment = require('../models/Assignment');
        const facultyUser = await User.findOne({ email: facultyEmail });
        if (facultyUser && course) {
            const assignmentExists = await Assignment.findOne({
                facultyId: facultyUser._id,
                courseId: course._id,
                section: 'A'
            });
            if (!assignmentExists) {
                await Assignment.create({
                    facultyId: facultyUser._id,
                    courseId: course._id,
                    section: 'A'
                });
                console.log('🌱 Seeded Assignment: Dr. Amit Kumar -> CS101 (Section A)');
            }
        }

        // Seed Feedback Session to be open by default
        const FeedbackSession = require('../models/FeedbackSession');
        const sessionExists = await FeedbackSession.findOne({ sessionName: 'Spring 2026 Feedback' });
        if (!sessionExists) {
            await FeedbackSession.create({
                sessionName: 'Spring 2026 Feedback',
                isOpen: true,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            });
            console.log('🌱 Seeded Feedback Session: Spring 2026 Feedback (Open)');
        }

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
