import { PRIORITY_COLORS } from '../../utils/priorityColors';

export default function PriorityBadge({ priority }) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  return (
    <span className="badge" style={{ color: colors.color, background: colors.bg }}>
      <span className="badge-dot" />
      {priority}
    </span>
  );
}
