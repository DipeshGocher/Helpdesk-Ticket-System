import { STATUS_COLORS } from '../../utils/priorityColors';

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Open;
  return (
    <span className="badge" style={{ color: colors.color, background: colors.bg }}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
