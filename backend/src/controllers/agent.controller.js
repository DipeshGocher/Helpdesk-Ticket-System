const catchAsync = require('../utils/catchAsync');
const { listAgentsWithLoad } = require('../services/assignment.service');

const listAgents = catchAsync(async (req, res) => {
  const agents = await listAgentsWithLoad();
  res.status(200).json({ success: true, data: agents });
});

module.exports = { listAgents };
