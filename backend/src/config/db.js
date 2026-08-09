const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);

    // Mongoose only auto-builds indexes once per model registration, in the background,
    // fire-and-forget. That's unreliable across collection drops/recreations (e.g. a
    // dev clearing test data) - explicitly syncing on every boot guarantees unique
    // constraints (email, agent name) are always actually enforced, not just assumed.
    await mongoose.syncIndexes();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
