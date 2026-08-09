const FIELD_LABELS = {
  status: 'Status',
  priority: 'Priority',
  title: 'Title',
  description: 'Description',
  category: 'Category',
};

// Turns a PATCH payload like { status: 'Resolved' } into a display-friendly list,
// so the conflict modal can show the user exactly what they were trying to do.
export function describeAttemptedChange(attemptedChange) {
  if (!attemptedChange) return [];
  return Object.entries(attemptedChange)
    .filter(([key, value]) => key in FIELD_LABELS && value !== undefined)
    .map(([key, value]) => ({ field: key, label: FIELD_LABELS[key], value }));
}
