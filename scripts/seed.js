const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure mongoose strictQuery is set
mongoose.set('strictQuery', true);

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Questionnaire = require('../models/Questionnaire');
const FeedbackSession = require('../models/FeedbackSession');
const PrivacyNotice = require('../models/PrivacyNotice');

const sampleStudents = [
    { name: 'Aarav Sharma', email: 'aarav.sharma@iiitranchi.ac.in', rollNo: '2026-CS-01', section: 'A', semester: 4 },
    { name: 'Ananya Verma', email: 'ananya.verma@iiitranchi.ac.in', rollNo: '2026-CS-02', section: 'A', semester: 4 },
    { name: 'Kabir Gupta', email: 'kabir.gupta@iiitranchi.ac.in', rollNo: '2026-CS-03', section: 'A', semester: 4 },
    { name: 'Ishaan Roy', email: 'ishaan.roy@iiitranchi.ac.in', rollNo: '2026-CS-04', section: 'B', semester: 4 },
    { name: 'Sanya Iyer', email: 'sanya.iyer@iiitranchi.ac.in', rollNo: '2026-CS-05', section: 'B', semester: 4 },
    { name: 'Diya Sen', email: 'diya.sen@iiitranchi.ac.in', rollNo: '2026-CS-06', section: 'A', semester: 6 },
    { name: 'Rohan Mehta', email: 'rohan.mehta@iiitranchi.ac.in', rollNo: '2026-CS-07', section: 'A', semester: 6 },
    { name: 'Aditi Rao', email: 'aditi.rao@iiitranchi.ac.in', rollNo: '2026-CS-08', section: 'B', semester: 6 },
    { name: 'Aryan Joshi', email: 'aryan.joshi@iiitranchi.ac.in', rollNo: '2026-CS-09', section: 'B', semester: 6 },
    { name: 'Meera Nair', email: 'meera.nair@iiitranchi.ac.in', rollNo: '2026-CS-10', section: 'A', semester: 4 },
    { name: 'Pranav Saxena', email: 'pranav.saxena@iiitranchi.ac.in', rollNo: '2026-CS-11', section: 'B', semester: 4 },
    { name: 'Kirti Mishra', email: 'kirti.mishra@iiitranchi.ac.in', rollNo: '2026-CS-12', section: 'A', semester: 6 },
    { name: 'Devansh Patil', email: 'devansh.patil@iiitranchi.ac.in', rollNo: '2026-CS-13', section: 'B', semester: 6 },
    { name: 'Nisha Reddy', email: 'nisha.reddy@iiitranchi.ac.in', rollNo: '2026-CS-14', section: 'A', semester: 4 },
    { name: 'Yash Kapoor', email: 'yash.kapoor@iiitranchi.ac.in', rollNo: '2026-CS-15', section: 'B', semester: 6 }
];

const sampleFaculty = [
    { name: 'Dr. R. K. Singh', email: 'rk.singh@iiitranchi.ac.in' },
    { name: 'Prof. Sneha Das', email: 'sneha.das@iiitranchi.ac.in' },
    { name: 'Dr. Vikram Seth', email: 'vikram.seth@iiitranchi.ac.in' },
    { name: 'Dr. Manoj Dubey', email: 'manoj.dubey@iiitranchi.ac.in' },
    { name: 'Prof. Priya Nair', email: 'priya.nair@iiitranchi.ac.in' }
];

const sampleCourses = [
    { courseName: 'Object Oriented Programming', courseCode: 'CS201' },
    { courseName: 'Database Management Systems', courseCode: 'CS202' },
    { courseName: 'Design and Analysis of Algorithms', courseCode: 'CS301' },
    { courseName: 'Computer Networks', courseCode: 'CS302' },
    { courseName: 'Computer Programming & Data Structures', courseCode: 'CS101' }
];

const standardQuestions = [
    { questionText: 'Subject Knowledge & Preparation' },
    { questionText: 'Communication & Explanation Clarity' },
    { questionText: 'Syllabus Coverage & Punctuality' },
    { questionText: 'Accessibility for Doubt Solving' }
];

const seedData = async () => {
    try {
        const retentionMonths = parseInt(process.env.DATA_RETENTION_MONTHS || '60', 10);
        const retentionExpiry = new Date();
        retentionExpiry.setMonth(retentionExpiry.getMonth() + retentionMonths);

        console.log(`🔌 Connecting to MongoDB: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB.');

        // 1. Seed Admin Accounts
        console.log('🌱 Seeding Admin accounts...');
        const adminAccounts = [
            { name: 'System Admin', email: 'admin@iiitranchi.ac.in', password: 'admin123' },
            { name: 'Karn Ashutosh', email: 'karnashutosh6@gmail.com', password: 'admin123' }
        ];

        for (const admin of adminAccounts) {
            let user = await User.findOne({ email: admin.email });
            if (!user) {
                user = await User.create({
                    name: admin.name,
                    email: admin.email,
                    password: admin.password,
                    role: 'Admin',
                    isActive: true,
                    requiresPasswordChange: false,
                    consentGiven: true,
                    consentTimestamp: new Date(),
                    dataRetentionExpiry: retentionExpiry
                });
                console.log(`   + Created Admin: ${admin.name} (${admin.email})`);
            } else {
                // Update password and fields if already existing
                user.password = admin.password;
                user.role = 'Admin';
                user.isActive = true;
                user.requiresPasswordChange = false;
                user.dataRetentionExpiry = retentionExpiry;
                await user.save();
                console.log(`   ~ Reset Admin: ${admin.name} (${admin.email})`);
            }
        }

        // 2. Seed Faculty Accounts
        console.log('🌱 Seeding Faculty accounts...');
        const facultyDocs = [];
        for (const fac of sampleFaculty) {
            let user = await User.findOne({ email: fac.email });
            if (!user) {
                user = await User.create({
                    name: fac.name,
                    email: fac.email,
                    password: 'faculty123',
                    role: 'Faculty',
                    isActive: true,
                    requiresPasswordChange: false,
                    consentGiven: true,
                    consentTimestamp: new Date(),
                    dataRetentionExpiry: retentionExpiry
                });
                console.log(`   + Created Faculty: ${fac.name} (${fac.email})`);
            } else {
                user.password = 'faculty123';
                user.role = 'Faculty';
                user.isActive = true;
                user.requiresPasswordChange = false;
                user.dataRetentionExpiry = retentionExpiry;
                await user.save();
                console.log(`   ~ Reset Faculty: ${fac.name} (${fac.email})`);
            }
            facultyDocs.push(user);
        }

        // Add legacy faculty if not present
        let legacyFaculty = await User.findOne({ email: 'faculty@iiitranchi.ac.in' });
        if (!legacyFaculty) {
            legacyFaculty = await User.create({
                name: 'Dr. Amit Kumar',
                email: 'faculty@iiitranchi.ac.in',
                password: 'faculty123',
                role: 'Faculty',
                isActive: true,
                requiresPasswordChange: false,
                consentGiven: true,
                consentTimestamp: new Date(),
                dataRetentionExpiry: retentionExpiry
            });
            console.log(`   + Created Legacy Faculty: Dr. Amit Kumar (faculty@iiitranchi.ac.in)`);
        } else {
            legacyFaculty.password = 'faculty123';
            legacyFaculty.role = 'Faculty';
            legacyFaculty.isActive = true;
            legacyFaculty.requiresPasswordChange = false;
            legacyFaculty.dataRetentionExpiry = retentionExpiry;
            await legacyFaculty.save();
            console.log(`   ~ Reset Legacy Faculty: Dr. Amit Kumar (faculty@iiitranchi.ac.in)`);
        }
        facultyDocs.push(legacyFaculty);

        // 3. Seed Students
        console.log('🌱 Seeding Student accounts...');
        for (const stud of sampleStudents) {
            let user = await User.findOne({ email: stud.email });
            if (!user) {
                await User.create({
                    name: stud.name,
                    email: stud.email,
                    password: 'IIITR@2026',
                    role: 'Student',
                    rollNo: stud.rollNo,
                    section: stud.section,
                    semester: stud.semester,
                    isActive: true,
                    requiresPasswordChange: false,
                    consentGiven: true,
                    consentTimestamp: new Date(),
                    dataRetentionExpiry: retentionExpiry
                });
                console.log(`   + Created Student: ${stud.name} (${stud.rollNo})`);
            } else {
                user.password = 'IIITR@2026';
                user.rollNo = stud.rollNo;
                user.section = stud.section;
                user.semester = stud.semester;
                user.isActive = true;
                user.requiresPasswordChange = false;
                user.dataRetentionExpiry = retentionExpiry;
                await user.save();
                console.log(`   ~ Reset Student: ${stud.name} (${stud.rollNo})`);
            }
        }

        // Add legacy student if not present
        let legacyStudent = await User.findOne({ email: 'student@iiitranchi.ac.in' });
        if (!legacyStudent) {
            legacyStudent = await User.create({
                name: 'Karn Ashutosh',
                email: 'student@iiitranchi.ac.in',
                password: 'student123',
                role: 'Student',
                section: 'A',
                rollNo: '2026-CS-42',
                semester: 4,
                isActive: true,
                requiresPasswordChange: false,
                consentGiven: true,
                consentTimestamp: new Date(),
                dataRetentionExpiry: retentionExpiry
            });
            console.log(`   + Created Legacy Student: Karn Ashutosh (student@iiitranchi.ac.in)`);
        } else {
            legacyStudent.password = 'student123';
            legacyStudent.rollNo = '2026-CS-42';
            legacyStudent.section = 'A';
            legacyStudent.semester = 4;
            legacyStudent.isActive = true;
            legacyStudent.requiresPasswordChange = false;
            legacyStudent.dataRetentionExpiry = retentionExpiry;
            await legacyStudent.save();
            console.log(`   ~ Reset Legacy Student: Karn Ashutosh (student@iiitranchi.ac.in)`);
        }

        // 4. Seed Course Catalogs
        console.log('🌱 Seeding Courses...');
        const courseDocs = [];
        for (const c of sampleCourses) {
            let course = await Course.findOne({ courseCode: c.courseCode });
            if (!course) {
                course = await Course.create(c);
                console.log(`   + Created Course: ${c.courseCode} — ${c.courseName}`);
            } else {
                console.log(`   ~ Course already exists: ${c.courseCode}`);
            }
            courseDocs.push(course);
        }

        // 5. Seed Questionnaire Standard Questions
        console.log('🌱 Seeding Questionnaire...');
        for (const q of standardQuestions) {
            const exists = await Questionnaire.findOne({ questionText: q.questionText });
            if (!exists) {
                await Questionnaire.create({ questionText: q.questionText, isActive: true });
                console.log(`   + Created Question: "${q.questionText}"`);
            } else {
                console.log(`   ~ Question already exists: "${q.questionText}"`);
            }
        }

        // 6. Seed Course Assignments
        console.log('🌱 Seeding Course Assignments...');
        const facultyMap = {};
        for (const f of facultyDocs) {
            facultyMap[f.email] = f._id;
        }

        const courseMap = {};
        for (const c of courseDocs) {
            courseMap[c.courseCode] = c._id;
        }

        const assignSpecs = [
            { facEmail: 'rk.singh@iiitranchi.ac.in', cCode: 'CS201', sec: 'A', sem: 4 },
            { facEmail: 'sneha.das@iiitranchi.ac.in', cCode: 'CS202', sec: 'A', sem: 4 },
            { facEmail: 'vikram.seth@iiitranchi.ac.in', cCode: 'CS201', sec: 'B', sem: 4 },
            { facEmail: 'manoj.dubey@iiitranchi.ac.in', cCode: 'CS202', sec: 'B', sem: 4 },
            { facEmail: 'priya.nair@iiitranchi.ac.in', cCode: 'CS301', sec: 'A', sem: 6 },
            { facEmail: 'rk.singh@iiitranchi.ac.in', cCode: 'CS302', sec: 'A', sem: 6 },
            { facEmail: 'vikram.seth@iiitranchi.ac.in', cCode: 'CS301', sec: 'B', sem: 6 },
            { facEmail: 'sneha.das@iiitranchi.ac.in', cCode: 'CS302', sec: 'B', sem: 6 },
            // Legacy assignment
            { facEmail: 'faculty@iiitranchi.ac.in', cCode: 'CS101', sec: 'A', sem: 1 }
        ];

        for (const spec of assignSpecs) {
            const facId = facultyMap[spec.facEmail];
            const cId = courseMap[spec.cCode];

            if (facId && cId) {
                const specExists = await Assignment.findOne({
                    facultyId: facId,
                    courseId: cId,
                    section: spec.sec,
                    semester: spec.sem
                });

                if (!specExists) {
                    await Assignment.create({
                        facultyId: facId,
                        courseId: cId,
                        section: spec.sec,
                        semester: spec.sem
                    });
                    console.log(`   + Linked: ${spec.facEmail} -> ${spec.cCode} [Sec ${spec.sec}, Sem ${spec.sem}]`);
                } else {
                    console.log(`   ~ Assignment link already exists for ${spec.cCode} [Sec ${spec.sec}, Sem ${spec.sem}]`);
                }
            }
        }

        // 7. Seed Feedback Sessions
        console.log('🌱 Seeding Feedback Sessions...');
        const sessionExists = await FeedbackSession.findOne({ sessionName: 'Spring 2026 Feedback' });
        if (!sessionExists) {
            await FeedbackSession.create({
                sessionName: 'Spring 2026 Feedback',
                isOpen: true,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            console.log('   + Created Feedback Session: "Spring 2026 Feedback" (Open)');
        } else {
            console.log('   ~ Feedback Session already exists: "Spring 2026 Feedback"');
        }

        // 8. Seed Versioned Privacy Notice (DPDP Act)
        console.log('🌱 Seeding active Privacy Notice...');
        const noticeVersion = process.env.PRIVACY_NOTICE_VERSION || '1.0';
        const noticeExists = await PrivacyNotice.findOne({ version: noticeVersion });
        if (!noticeExists) {
            await PrivacyNotice.create({
                version: noticeVersion,
                title: 'IIIT Ranchi Faculty Feedback System — Privacy Notice',
                effectiveDate: new Date(),
                isActive: true,
                content: 'We are committed to protecting the personal data of our students and faculty members. In compliance with the Digital Personal Data Protection (DPDP) Act, 2023 (India), this notice explains what personal data we collect, why we collect it, how it is processed, and your rights as a Data Principal.',
                sections: {
                    dataCollected: 'We collect your name, email address, roll number, department/section, semester, phone number (optional), and feedback ratings/comments. System audit logs also record login times, IP addresses, and user actions for security purposes.',
                    purposeOfProcessing: 'To conduct objective faculty performance evaluation, enable institutional quality assurance, check course coverage, and address grievances.',
                    dataRetentionPolicy: 'Data retention is set to 60 months (duration of student enrollment + buffer), after which personal data is automatically anonymized or erased. Audit logs are automatically pruned after 365 days. Individual ratings/remarks are anonymized.',
                    dataPrincipalRights: 'As a Data Principal under DPDP, you have: (1) Right to Access summary of processing, (2) Right to Correction and Erasure of personal data, (3) Right of Grievance Redressal, and (4) Right to Withdraw Consent at any time.',
                    grievanceOfficer: 'Dr. Vivek Kumar, Data Protection Officer, IIIT Ranchi. Email: dpo@iiitranchi.ac.in',
                    contactInformation: 'IIIT Ranchi Campus, Namkum, Ranchi, Jharkhand — 834010.'
                }
            });
            console.log(`   + Created Privacy Notice version ${noticeVersion}`);
        } else {
            console.log(`   ~ Privacy Notice version ${noticeVersion} already exists`);
        }

        console.log('🎉 Seeding successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error(`❌ Seeding Error: ${err.message}`);
        process.exit(1);
    }
};

seedData();
