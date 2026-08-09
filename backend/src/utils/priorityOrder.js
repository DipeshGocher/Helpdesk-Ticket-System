// Custom severity order - NOT alphabetical. Index 0 = most severe.
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

const PRIORITY_RANK = PRIORITY_ORDER.reduce((acc, priority, index) => {
  acc[priority] = index;
  return acc;
}, {});

// Returns the next-more-severe priority, or the same value if already Critical (max severity).
function getNextPriority(priority) {
  const currentRank = PRIORITY_RANK[priority];
  if (currentRank === 0) return priority;
  return PRIORITY_ORDER[currentRank - 1];
}

module.exports = { PRIORITY_ORDER, PRIORITY_RANK, getNextPriority };
