const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure mongoose strictQuery is set
mongoose.set('strictQuery', true);

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');

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
    { courseName: 'Computer Networks', courseCode: 'CS302' }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to MongoDB for seeding...');

        // 1. Seed Faculty
        console.log('🌱 Seeding Faculty accounts...');
        const facultyDocs = [];
        for (const fac of sampleFaculty) {
            let user = await User.findOne({ email: fac.email });
            if (!user) {
                user = await User.create({
                    name: fac.name,
                    email: fac.email,
                    password: 'faculty123', // Standard local-part password hook
                    role: 'Faculty',
                    isActive: true,
                    requiresPasswordChange: false
                });
                console.log(`   + Created Faculty: ${fac.name} (${fac.email})`);
            } else {
                console.log(`   ~ Faculty already exists: ${fac.name}`);
            }
            facultyDocs.push(user);
        }

        // 2. Seed Students
        console.log('🌱 Seeding Student accounts...');
        for (const stud of sampleStudents) {
            const userExists = await User.findOne({ email: stud.email });
            if (!userExists) {
                await User.create({
                    name: stud.name,
                    email: stud.email,
                    password: 'IIITR@2026', // Secured default password
                    role: 'Student',
                    rollNo: stud.rollNo,
                    section: stud.section,
                    semester: stud.semester,
                    isActive: true,
                    requiresPasswordChange: false // Disabled for sandbox — no forced redirect in test mode
                });
                console.log(`   + Created Student: ${stud.name} (${stud.rollNo})`);
            } else {
                console.log(`   ~ Student already exists: ${stud.name}`);
            }
        }

        // 3. Seed Courses
        console.log('🌱 Seeding Courses catalogs...');
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

        // 4. Seed Relational Assignments Linker
        console.log('🌱 Seeding Relational Course Assignments...');
        
        // Find Faculty map for simple lookups
        const facultyMap = {};
        for (const f of facultyDocs) {
            facultyMap[f.email] = f._id;
        }

        const courseMap = {};
        for (const c of courseDocs) {
            courseMap[c.courseCode] = c._id;
        }

        // We assign:
        // Section A, Semester 4: CS201 (Oop) under Dr. R. K. Singh & CS202 (Dbms) under Prof. Sneha Das
        // Section B, Semester 4: CS201 (Oop) under Dr. Vikram Seth & CS202 (Dbms) under Dr. Manoj Dubey
        // Section A, Semester 6: CS301 (Algo) under Prof. Priya Nair & CS302 (Cn) under Dr. R. K. Singh
        // Section B, Semester 6: CS301 (Algo) under Dr. Vikram Seth & CS302 (Cn) under Prof. Sneha Das
        const assignSpecs = [
            { facEmail: 'rk.singh@iiitranchi.ac.in', cCode: 'CS201', sec: 'A', sem: 4 },
            { facEmail: 'sneha.das@iiitranchi.ac.in', cCode: 'CS202', sec: 'A', sem: 4 },
            { facEmail: 'vikram.seth@iiitranchi.ac.in', cCode: 'CS201', sec: 'B', sem: 4 },
            { facEmail: 'manoj.dubey@iiitranchi.ac.in', cCode: 'CS202', sec: 'B', sem: 4 },
            { facEmail: 'priya.nair@iiitranchi.ac.in', cCode: 'CS301', sec: 'A', sem: 6 },
            { facEmail: 'rk.singh@iiitranchi.ac.in', cCode: 'CS302', sec: 'A', sem: 6 },
            { facEmail: 'vikram.seth@iiitranchi.ac.in', cCode: 'CS301', sec: 'B', sem: 6 },
            { facEmail: 'sneha.das@iiitranchi.ac.in', cCode: 'CS302', sec: 'B', sem: 6 }
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
                    console.log(`   ~ Assignment link already exists for ${spec.cCode} [Sec ${spec.sec}]`);
                }
            }
        }

        console.log('🎉 Seeding successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error(`❌ Seeding Error: ${err.message}`);
        process.exit(1);
    }
};

seedData();
