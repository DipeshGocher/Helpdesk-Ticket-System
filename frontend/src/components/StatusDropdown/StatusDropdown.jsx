import StatusBadge from '../Badges/StatusBadge';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { ALLOWED_STATUS_TRANSITIONS } from '../../constants/enums';
import styles from './StatusDropdown.module.css';

// Shows the current status as a badge, plus a picker limited to the transitions the
// backend's state machine actually allows from here (mirrors statusTransitions.js server-side).
export default function StatusDropdown({ status, onChangeStatus, isUpdating = false }) {
  const nextOptions = ALLOWED_STATUS_TRANSITIONS[status] || [];

  return (
    <div className={styles.wrap}>
      <StatusBadge status={status} />

      {isUpdating ? (
        <LoadingSpinner inline size={16} label="" />
      ) : nextOptions.length > 0 ? (
        <select
          className={`select ${styles.select}`}
          value=""
          onChange={(e) => {
            if (e.target.value) onChangeStatus(e.target.value);
          }}
          aria-label="Move ticket to a new status"
        >
          <option value="">Move to…</option>
          {nextOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <span className={styles.terminalHint}>No further transitions</span>
      )}
    </div>
  );
}
