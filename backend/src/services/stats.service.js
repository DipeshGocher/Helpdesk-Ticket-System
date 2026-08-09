const Ticket = require('../models/ticket.model');
const { STATUS_ENUM, PRIORITY_ENUM, CATEGORY_ENUM } = Ticket;
const {
  buildSlaAddFieldsStage,
  buildSlaStateAddFieldsStage,
  buildSlaBreachedAddFieldsStage,
} = require('../utils/slaAggregationStages');

function zeroFill(enumValues, groups) {
  const map = Object.fromEntries(enumValues.map((v) => [v, 0]));
  for (const g of groups) {
    if (g._id in map) map[g._id] = g.count;
  }
  return map;
}

// Exactly one aggregation pipeline computes every stat via $facet.
async function getStats() {
  const [result] = await Ticket.aggregate([
    buildSlaAddFieldsStage(),
    buildSlaStateAddFieldsStage(),
    buildSlaBreachedAddFieldsStage(),
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        slaBreachedCount: [
          { $match: { isBreached: true, status: { $in: ['Open', 'In Progress'] } } },
          { $count: 'count' },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return {
    total: result.total[0]?.count || 0,
    byStatus: zeroFill(STATUS_ENUM, result.byStatus),
    byPriority: zeroFill(PRIORITY_ENUM, result.byPriority),
    byCategory: zeroFill(CATEGORY_ENUM, result.byCategory),
    slaBreachedCount: result.slaBreachedCount[0]?.count || 0,
  };
}

module.exports = { getStats };
