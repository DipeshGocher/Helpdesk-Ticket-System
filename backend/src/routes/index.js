const express = require('express');
const ticketRoutes = require('./ticket.routes');
const agentRoutes = require('./agent.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/agents', agentRoutes);

module.exports = router;
