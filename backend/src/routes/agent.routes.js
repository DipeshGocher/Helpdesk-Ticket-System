const express = require('express');
const agentController = require('../controllers/agent.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', protect, authorize('agent'), agentController.listAgents);

module.exports = router;
