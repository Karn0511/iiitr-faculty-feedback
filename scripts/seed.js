const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure mongoose strictQuery is set
mongoose.set('strictQuery', true);

// Import models
const User = require('../models/User');
const Questionnaire = require('../models/Questionnaire');
const PrivacyNotice = require('../models/PrivacyNotice');

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

        console.log(`🔌 Connecting to MongoDB for production seeding: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB.');

        // 1. Seed Admin Accounts
        console.log('🌱 Seeding production Admin accounts...');
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
                user.password = admin.password;
                user.role = 'Admin';
                user.isActive = true;
                user.requiresPasswordChange = false;
                user.dataRetentionExpiry = retentionExpiry;
                await user.save();
                console.log(`   ~ Reset Admin: ${admin.name} (${admin.email})`);
            }
        }

        // 2. Seed Questionnaire Standard Questions
        console.log('🌱 Seeding standard Questionnaire questions...');
        for (const q of standardQuestions) {
            const exists = await Questionnaire.findOne({ questionText: q.questionText });
            if (!exists) {
                await Questionnaire.create({ questionText: q.questionText, isActive: true });
                console.log(`   + Created Question: "${q.questionText}"`);
            } else {
                console.log(`   ~ Question already exists: "${q.questionText}"`);
            }
        }

        // 3. Seed Versioned Privacy Notice (DPDP Act)
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

        console.log('🎉 Production seeding successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error(`❌ Seeding Error: ${err.message}`);
        process.exit(1);
    }
};

seedData();
