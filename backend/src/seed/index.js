const mongoose = require('mongoose');
const connectDB = require('../config/db');
const seedAgents = require('./agents.seed');

async function run() {
  await connectDB();
  await seedAgents();
  console.log('Agents seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
