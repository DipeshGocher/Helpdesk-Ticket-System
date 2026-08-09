const { SLA_HOURS, AT_RISK_THRESHOLD } = require('./slaConfig');
const { PRIORITY_ORDER } = require('./priorityOrder');

// Shared $addFields stage: computes priorityRank (for non-alphabetical sorting),
// slaDeadlineComputed, and slaState, all derived live from priority/createdAt/status.
// Reused by the ticket list pipeline (sorting) and the stats pipeline (breach counts).
function buildSlaAddFieldsStage() {
  const priorityRankBranches = PRIORITY_ORDER.map((priority, index) => ({
    case: { $eq: ['$priority', priority] },
    then: index,
  }));

  const slaHoursBranches = PRIORITY_ORDER.map((priority) => ({
    case: { $eq: ['$priority', priority] },
    then: SLA_HOURS[priority],
  }));

  return {
    $addFields: {
      priorityRank: { $switch: { branches: priorityRankBranches, default: PRIORITY_ORDER.length } },
      slaDeadlineComputed: {
        $add: [
          '$createdAt',
          {
            $multiply: [
              { $switch: { branches: slaHoursBranches, default: 0 } },
              3600000,
            ],
          },
        ],
      },
    },
  };
}

// Second $addFields stage - depends on slaDeadlineComputed existing already, so kept separate.
function buildSlaStateAddFieldsStage() {
  return {
    $addFields: {
      slaEndTime: {
        $cond: [
          { $and: [{ $in: ['$status', ['Resolved', 'Closed']] }, { $ne: ['$resolvedAt', null] }] },
          '$resolvedAt',
          '$$NOW',
        ],
      },
    },
  };
}

function buildSlaBreachedAddFieldsStage() {
  return {
    $addFields: {
      isBreached: { $gt: ['$slaEndTime', '$slaDeadlineComputed'] },
      slaState: {
        $switch: {
          branches: [
            { case: { $gt: ['$slaEndTime', '$slaDeadlineComputed'] }, then: 'breached' },
            {
              case: {
                $gte: [
                  { $subtract: ['$$NOW', '$createdAt'] },
                  { $multiply: [{ $subtract: ['$slaDeadlineComputed', '$createdAt'] }, AT_RISK_THRESHOLD] },
                ],
              },
              then: 'at_risk',
            },
          ],
          default: 'ok',
        },
      },
    },
  };
}

module.exports = {
  buildSlaAddFieldsStage,
  buildSlaStateAddFieldsStage,
  buildSlaBreachedAddFieldsStage,
};
