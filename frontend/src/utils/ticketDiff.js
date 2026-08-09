// Merges a fresh poll snapshot into the current ticket list, counting how many
// tickets actually changed (added, removed, or changed by version/status) - drives
// the "N tickets updated" toast - while reusing the OLD object reference for any
// ticket that didn't change. That reference stability is what lets React.memo on
// TicketCard skip re-rendering cards nothing happened to.
export function mergeTicketLists(prevList, nextList) {
  const prevById = new Map(prevList.map((t) => [t._id, t]));
  let changedCount = 0;

  const merged = nextList.map((next) => {
    const prev = prevById.get(next._id);
    const isUnchanged =
      prev && prev.version === next.version && prev.status === next.status && prev.updatedAt === next.updatedAt;

    if (isUnchanged) return prev;

    changedCount += 1;
    return next;
  });

  const nextIds = new Set(nextList.map((t) => t._id));
  for (const id of prevById.keys()) {
    if (!nextIds.has(id)) changedCount += 1;
  }

  return { merged, changedCount };
}
