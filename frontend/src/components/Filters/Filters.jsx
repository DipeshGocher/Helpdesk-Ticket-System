import { memo } from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SORTABLE_FIELDS } from '../../constants/enums';
import styles from './Filters.module.css';

// "Ascending/Descending" is ambiguous for priority (does descending mean most or
// least severe?) so the order labels are worded per sort field instead of generically.
const ORDER_LABELS = {
  priority: { desc: 'Most severe first', asc: 'Least severe first' },
  slaDeadline: { desc: 'Latest deadline first', asc: 'Soonest deadline first' },
  createdAt: { desc: 'Newest first', asc: 'Oldest first' },
};

function Filters({ filters, onChange, onClear }) {
  const hasActiveFilters =
    filters.status || filters.priority || filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc';

  const orderLabels = ORDER_LABELS[filters.sortBy] || ORDER_LABELS.createdAt;

  return (
    <div className={styles.wrap}>
      <div className="field">
        <label className="field-label" htmlFor="filter-status">
          Status
        </label>
        <select
          id="filter-status"
          className="select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="filter-priority">
          Priority
        </label>
        <select
          id="filter-priority"
          className="select"
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="filter-sortBy">
          Sort by
        </label>
        <select
          id="filter-sortBy"
          className="select"
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value })}
        >
          {SORTABLE_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="filter-sortOrder">
          Order
        </label>
        <select
          id="filter-sortOrder"
          className="select"
          value={filters.sortOrder}
          onChange={(e) => onChange({ sortOrder: e.target.value })}
        >
          <option value="desc">{orderLabels.desc}</option>
          <option value="asc">{orderLabels.asc}</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default memo(Filters);
