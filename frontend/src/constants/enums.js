// Mirrors the backend's enum values (backend/src/models/ticket.model.js) so the
// frontend never has to guess valid values for forms/filters.
export const CATEGORY_OPTIONS = ['Bug', 'Feature', 'Billing', 'Other'];
export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
export const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];

// Severity order, most severe first - matches backend/src/utils/priorityOrder.js
export const PRIORITY_SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

// Mirrors backend/src/utils/statusTransitions.js ALLOWED_TRANSITIONS.
export const ALLOWED_STATUS_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Queued: ['Open', 'Closed'],
};

export const SORTABLE_FIELDS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'slaDeadline', label: 'SLA Deadline' },
];

export const DEFAULT_PAGE_SIZE = 6;
