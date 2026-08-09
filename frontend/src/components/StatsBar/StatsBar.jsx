import { memo } from 'react';
import styles from './StatsBar.module.css';

const TILES = [
  { key: 'total', label: 'Total Tickets', accent: 'neutral' },
  { key: 'open', label: 'Open', accent: 'open' },
  { key: 'inProgress', label: 'In Progress', accent: 'inprogress' },
  { key: 'resolved', label: 'Resolved', accent: 'resolved' },
  { key: 'closed', label: 'Closed', accent: 'closed' },
  { key: 'queued', label: 'Queued', accent: 'queued' },
  { key: 'breached', label: 'SLA Breached', accent: 'danger' },
];

function StatsBar({ stats, isLoading }) {
  const values = {
    total: stats?.total ?? 0,
    open: stats?.byStatus?.Open ?? 0,
    inProgress: stats?.byStatus?.['In Progress'] ?? 0,
    resolved: stats?.byStatus?.Resolved ?? 0,
    closed: stats?.byStatus?.Closed ?? 0,
    queued: stats?.byStatus?.Queued ?? 0,
    breached: stats?.slaBreachedCount ?? 0,
  };

  return (
    <div className={styles.grid}>
      {TILES.map((tile) => (
        <div key={tile.key} className={`${styles.tile} ${styles[tile.accent]}`}>
          <span className={styles.value}>{isLoading ? '–' : values[tile.key]}</span>
          <span className={styles.label}>{tile.label}</span>
        </div>
      ))}
    </div>
  );
}

export default memo(StatsBar);
