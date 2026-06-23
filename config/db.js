const mongoose = require('mongoose');

// strictQuery must be set globally in Mongoose 7+/8+/9+
mongoose.set('strictQuery', true);

// ============================================================
// DATABASE CONNECTION — Clean, Connect-Only
//
// OWASP A05: Security Misconfiguration
//   - No inline seeding (moved to scripts/seed.js)
//   - No password resets on every startup
//   - Connection options for timeout handling
//
// DPDP: Seed data should be managed via explicit admin actions,
// not auto-executed on every server boot.
// ============================================================

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,  // Fail fast if no server
            socketTimeoutMS: 45000           // Close sockets after 45s inactivity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
