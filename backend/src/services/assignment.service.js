const Agent = require('../models/agent.model');
const Ticket = require('../models/ticket.model');

const ACTIVE_STATUSES = ['Open', 'In Progress'];

async function getActiveCount(agentId) {
  return Ticket.countDocuments({ assignedAgent: agentId, status: { $in: ACTIVE_STATUSES } });
}

// Selects the best agent for a new ticket: lowest load% -> lowest active count -> alphabetical.
// Returns null if every agent is at/above capacity.
async function pickAgentForNewTicket() {
  const agents = await Agent.find().lean();

  const candidates = await Promise.all(
    agents.map(async (agent) => ({
      agent,
      activeCount: await getActiveCount(agent._id),
    }))
  );

  const available = candidates.filter((c) => c.activeCount < c.agent.maxLoad);
  if (available.length === 0) return null;

  available.sort((a, b) => {
    const loadPctA = a.activeCount / a.agent.maxLoad;
    const loadPctB = b.activeCount / b.agent.maxLoad;
    if (loadPctA !== loadPctB) return loadPctA - loadPctB;
    if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
    return a.agent.name.localeCompare(b.agent.name);
  });

  return available[0];
}

// Mutates (does not save) a new Ticket document: assigns an agent or queues it.
async function assignTicketOnCreate(ticket) {
  const picked = await pickAgentForNewTicket();

  if (picked) {
    ticket.assignedAgent = picked.agent._id;
    ticket.status = 'Open';
    ticket.history.push({
      type: 'Auto Assignment',
      from: null,
      to: picked.agent.name,
      note: `Assigned on creation (load ${picked.activeCount + 1}/${picked.agent.maxLoad})`,
      timestamp: new Date(),
    });
  } else {
    ticket.assignedAgent = null;
    ticket.status = 'Queued';
    ticket.history.push({
      type: 'Auto Assignment',
      from: null,
      to: null,
      note: 'All agents at full capacity - ticket queued',
      timestamp: new Date(),
    });
  }

  return ticket;
}

// Called after a ticket transitions to Resolved/Closed, freeing capacity on its agent.
// Promotes exactly one ticket: the oldest Queued ticket, if the agent now has room.
async function promoteQueuedTicketIfAny(agentId) {
  if (!agentId) return null;

  const agent = await Agent.findById(agentId).lean();
  if (!agent) return null;

  const activeCount = await getActiveCount(agentId);
  if (activeCount >= agent.maxLoad) return null;

  const oldestQueued = await Ticket.findOne({ status: 'Queued' }).sort({ createdAt: 1 });
  if (!oldestQueued) return null;

  oldestQueued.assignedAgent = agentId;
  oldestQueued.status = 'Open';
  oldestQueued.version += 1;
  oldestQueued.history.push({
    type: 'Queue Assignment',
    from: 'Queued',
    to: 'Open',
    note: `Auto-promoted from queue to agent ${agent.name}`,
    timestamp: new Date(),
  });

  await oldestQueued.save();
  return oldestQueued;
}

// Bonus endpoint support: current load snapshot for every agent.
async function listAgentsWithLoad() {
  const agents = await Agent.find().sort({ name: 1 }).lean();

  return Promise.all(
    agents.map(async (agent) => {
      const activeCount = await getActiveCount(agent._id);
      return {
        _id: agent._id,
        name: agent.name,
        maxLoad: agent.maxLoad,
        activeCount,
        loadPct: Number((activeCount / agent.maxLoad).toFixed(4)),
      };
    })
  );
}

module.exports = {
  getActiveCount,
  pickAgentForNewTicket,
  assignTicketOnCreate,
  promoteQueuedTicketIfAny,
  listAgentsWithLoad,
  ACTIVE_STATUSES,
};
