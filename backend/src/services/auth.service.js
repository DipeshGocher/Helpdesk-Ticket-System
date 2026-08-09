const jwt = require('jsonwebtoken');
const Agent = require('../models/agent.model');
const Customer = require('../models/customer.model');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const MODEL_BY_ROLE = { agent: Agent, customer: Customer };

function generateToken({ id, role }) {
  return jwt.sign({ id, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function sanitize(userDoc, role) {
  const obj = userDoc.toObject();
  delete obj.password;
  return { ...obj, role };
}

async function registerCustomer({ name, email, password }) {
  const customer = await Customer.create({ name, email, password });
  const token = generateToken({ id: customer._id, role: 'customer' });
  return { user: sanitize(customer, 'customer'), token };
}

async function login({ email, password, role }) {
  const Model = MODEL_BY_ROLE[role];
  const userDoc = await Model.findOne({ email }).select('+password');

  if (!userDoc || !(await userDoc.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({ id: userDoc._id, role });
  return { user: sanitize(userDoc, role), token };
}

async function getMe(requester) {
  const Model = MODEL_BY_ROLE[requester.role];
  const userDoc = await Model.findById(requester.id);
  if (!userDoc) throw new ApiError(401, 'Account no longer exists');
  return sanitize(userDoc, requester.role);
}

module.exports = { generateToken, registerCustomer, login, getMe };
