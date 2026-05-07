/**
 * One-time patch: clear the requiresPasswordChange flag for all demo/sandbox
 * accounts so testers don't get redirected to the reset-password screen.
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

mongoose.set('strictQuery', true);
const User = require('./models/User');

const SANDBOX_EMAILS = [
  // Students
  'aarav.sharma@iiitranchi.ac.in',
  'ananya.verma@iiitranchi.ac.in',
  'kabir.gupta@iiitranchi.ac.in',
  'ishaan.roy@iiitranchi.ac.in',
  'sanya.iyer@iiitranchi.ac.in',
  'diya.sen@iiitranchi.ac.in',
  'rohan.mehta@iiitranchi.ac.in',
  'aditi.rao@iiitranchi.ac.in',
  'aryan.joshi@iiitranchi.ac.in',
  'meera.nair@iiitranchi.ac.in',
  'pranav.saxena@iiitranchi.ac.in',
  'kirti.mishra@iiitranchi.ac.in',
  'devansh.patil@iiitranchi.ac.in',
  'nisha.reddy@iiitranchi.ac.in',
  'yash.kapoor@iiitranchi.ac.in',
  'student@iiitranchi.ac.in',
  // Faculty
  'rk.singh@iiitranchi.ac.in',
  'sneha.das@iiitranchi.ac.in',
  'vikram.seth@iiitranchi.ac.in',
  'manoj.dubey@iiitranchi.ac.in',
  'priya.nair@iiitranchi.ac.in',
  'faculty@iiitranchi.ac.in',
  // Admin
  'admin@iiitranchi.ac.in'
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB...');

    const result = await User.updateMany(
      { email: { $in: SANDBOX_EMAILS } },
      { $set: { requiresPasswordChange: false } }
    );

    console.log(`✅ Patched ${result.modifiedCount} / ${result.matchedCount} sandbox accounts.`);
    console.log('   requiresPasswordChange = false on all demo accounts.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Patch Error:', err.message);
    process.exit(1);
  }
})();
