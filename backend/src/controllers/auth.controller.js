const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.registerCustomer({ name, email, password });
  res.status(201).json({ success: true, data: result });
});

const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;
  const result = await authService.login({ email, password, role });
  res.status(200).json({ success: true, data: result });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user);
  res.status(200).json({ success: true, data: user });
});

module.exports = { register, login, getMe };
