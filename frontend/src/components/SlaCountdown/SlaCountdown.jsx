import { useNow } from '../../hooks/useNow';
import { computeCountdown } from '../../utils/slaCountdown';
import { SLA_COLORS, SLA_LABELS } from '../../utils/priorityColors';

// Ticks every second locally so only this badge re-renders, not the whole list.
export default function SlaCountdown({ slaDeadline, slaState }) {
  const now = useNow(1000);
  const { label } = computeCountdown(slaDeadline, now);
  const colors = SLA_COLORS[slaState] || SLA_COLORS.ok;

  return (
    <span
      className="badge"
      style={{ color: colors.color, background: colors.bg }}
      title={`SLA ${SLA_LABELS[slaState] || slaState}`}
    >
      <span className="badge-dot" />
      {SLA_LABELS[slaState] || slaState} · {label}
    </span>
  );
}
