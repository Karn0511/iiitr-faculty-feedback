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
                isActive: true
            });
            console.log(`🌱 Seeded Student user: ${studentEmail}`);
        } else {
            // Update password to be simple as requested
            studentExists.password = 'student123';
            await studentExists.save();
        }

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
