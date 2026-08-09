const bcrypt = require('bcryptjs');
const Agent = require('../models/agent.model');
const config = require('../config/env');

const REQUIRED_AGENTS = [
  { name: 'Riya', maxLoad: 3, email: 'riya@appzeto.com' },
  { name: 'Karan', maxLoad: 4, email: 'karan@appzeto.com' },
  { name: 'Dev', maxLoad: 5, email: 'dev@appzeto.com' },
];

// Idempotent AND self-healing: `maxLoad` only applies on insert ($setOnInsert, never
// clobbers a deliberately-changed value), but `email`/`password` are force-set on every
// boot. That's required, not just convenient - findOneAndUpdate never fires the model's
// pre('save') hash hook, so the password is hashed explicitly here; and since these 3
// agents almost certainly already existed before auth was added, an insert-only upsert
// would never backfill credentials onto them.
async function seedAgents() {
  const hashedPassword = await bcrypt.hash(config.defaultAgentPassword, 10);

  for (const agent of REQUIRED_AGENTS) {
    await Agent.findOneAndUpdate(
      { name: agent.name },
      {
        $set: { email: agent.email, password: hashedPassword },
        $setOnInsert: { maxLoad: agent.maxLoad },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
}

module.exports = seedAgents;
