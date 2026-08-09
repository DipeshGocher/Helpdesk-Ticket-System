import RelativeTime from '../RelativeTime/RelativeTime';
import styles from './Timeline.module.css';

const TYPE_META = {
  'Status Change': { icon: '↻', className: styles.statusDot },
  'Priority Change': { icon: '⚑', className: styles.priorityDot },
  'Auto Assignment': { icon: '⚙', className: styles.assignDot },
  'Queue Assignment': { icon: '⇥', className: styles.queueDot },
};

function describeEntry(entry) {
  switch (entry.type) {
    case 'Status Change':
      return `Status changed from ${entry.from ?? '—'} to ${entry.to ?? '—'}`;
    case 'Priority Change':
      return `Priority changed from ${entry.from ?? '—'} to ${entry.to ?? '—'}`;
    case 'Auto Assignment':
      return entry.to ? `Auto-assigned to ${entry.to}` : 'Auto-assignment attempted - no agent available';
    case 'Queue Assignment':
      return `Promoted from queue (${entry.from ?? '—'} → ${entry.to ?? '—'})`;
    default:
      return entry.type;
  }
}

export default function Timeline({ history = [] }) {
  if (history.length === 0) {
    return <p className="text-muted">No activity recorded yet.</p>;
  }

  const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <ul className={styles.timeline}>
      {sorted.map((entry, idx) => {
        const meta = TYPE_META[entry.type] || { icon: '•', className: styles.defaultDot };
        return (
          <li key={`${entry.type}-${entry.timestamp}-${idx}`} className={styles.item}>
            <span className={`${styles.dot} ${meta.className}`}>{meta.icon}</span>
            <div className={styles.content}>
              <div className={styles.headerRow}>
                <span className={styles.typeLabel}>{entry.type}</span>
                <RelativeTime date={entry.timestamp} className={styles.time} />
              </div>
              <p className={styles.description}>{describeEntry(entry)}</p>
              {entry.note && <p className={styles.note}>{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
