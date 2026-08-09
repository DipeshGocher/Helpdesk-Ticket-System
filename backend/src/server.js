const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const seedAgents = require('./seed/agents.seed');

async function start() {
  await connectDB();
  await seedAgents();

  const server = app.listen(config.port, () => {
    console.log(`Appzeto Helpdesk API running on port ${config.port} [${config.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
