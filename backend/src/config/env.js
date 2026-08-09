const dotenv = require('dotenv');

dotenv.config();

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  defaultAgentPassword: process.env.DEFAULT_AGENT_PASSWORD || 'Agent@123',
};

module.exports = config;
