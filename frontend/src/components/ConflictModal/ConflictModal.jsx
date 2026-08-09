import Modal from '../Modal/Modal';
import StatusBadge from '../Badges/StatusBadge';
import PriorityBadge from '../Badges/PriorityBadge';
import RelativeTime from '../RelativeTime/RelativeTime';
import { describeAttemptedChange } from '../../utils/describeChange';
import styles from './ConflictModal.module.css';

function ChangeValue({ field, value }) {
  if (field === 'status') return <StatusBadge status={value} />;
  if (field === 'priority') return <PriorityBadge priority={value} />;
  return <span className={styles.textValue}>{value}</span>;
}

// Shown when a PATCH returns 409 - someone else changed this ticket first.
// Backend embeds the authoritative current ticket in the error response. The user
// picks one of three resolutions: discard their edit, reapply it on top of the
// fresh version, or just walk away.
export default function ConflictModal({ isOpen, attemptedChange, currentTicket, onRetryMine, onTakeTheirs, onCancel }) {
  const changes = describeAttemptedChange(attemptedChange);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="This ticket changed elsewhere"
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-secondary" onClick={onTakeTheirs}>
            Take latest
          </button>
          <button type="button" className="btn btn-primary" onClick={onRetryMine}>
            Retry my change
          </button>
        </>
      }
    >
      <p className={styles.text}>
        Someone else updated this ticket before your change went through, so it was not saved. You can
        keep the current server state, or reapply your change on top of it.
      </p>

      {changes.length > 0 && (
        <div className={styles.block}>
          <span className={styles.blockLabel}>Your attempted change</span>
          <div className={styles.summary}>
            {changes.map(({ field, label, value }) => (
              <div className={styles.row} key={field}>
                <span className="text-muted">{label}</span>
                <ChangeValue field={field} value={value} />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTicket && (
        <div className={styles.block}>
          <span className={styles.blockLabel}>Current state on the server</span>
          <div className={styles.summary}>
            <div className={styles.row}>
              <span className="text-muted">Status</span>
              <StatusBadge status={currentTicket.status} />
            </div>
            <div className={styles.row}>
              <span className="text-muted">Priority</span>
              <PriorityBadge priority={currentTicket.priority} />
            </div>
            <div className={styles.row}>
              <span className="text-muted">Last updated</span>
              <RelativeTime date={currentTicket.updatedAt} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
