// Escapes user-supplied search input before building a $regex query, preventing
// regex-injection (e.g. a search string like "(a+)+" causing catastrophic backtracking).
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
