import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PriorityBadge from '../Badges/PriorityBadge';
import CategoryBadge from '../Badges/CategoryBadge';
import StatusBadge from '../Badges/StatusBadge';
import SlaCountdown from '../SlaCountdown/SlaCountdown';
import RelativeTime from '../RelativeTime/RelativeTime';
import StatusDropdown from '../StatusDropdown/StatusDropdown';
import styles from './TicketCard.module.css';

// Memoized because the list re-renders on every 5s poll - mergeTicketLists (see
// utils/ticketDiff.js) keeps the same object reference for tickets that didn't
// change, so this skip actually takes effect for the common case of a partial update.
// `readOnly` is used by the customer ticket list - customers can't change status, so
// they get a plain badge instead of the interactive dropdown (and no PATCH is ever wired up).
function TicketCard({ ticket, isUpdating, onStatusChange, readOnly = false }) {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/tickets/${ticket._id}`)}>
      <div className={styles.topRow}>
        <CategoryBadge category={ticket.category} />
        <PriorityBadge priority={ticket.priority} />
        <SlaCountdown slaDeadline={ticket.slaDeadline} slaState={ticket.slaState} />
      </div>

      <Link to={`/tickets/${ticket._id}`} className={styles.title} onClick={(e) => e.stopPropagation()}>
        {ticket.title}
      </Link>
      <p className={styles.description}>{ticket.description}</p>

      <div className={styles.metaRow}>
        <span className="text-muted">
          {ticket.assignedAgent ? `Assigned to ${ticket.assignedAgent.name}` : 'Unassigned'}
        </span>
        <span className="text-muted">
          Created <RelativeTime date={ticket.createdAt} />
        </span>
      </div>

      <div className={styles.footerRow} onClick={(e) => e.stopPropagation()}>
        {readOnly ? (
          <StatusBadge status={ticket.status} />
        ) : (
          <StatusDropdown
            status={ticket.status}
            isUpdating={isUpdating}
            onChangeStatus={(newStatus) => onStatusChange(ticket._id, newStatus)}
          />
        )}
      </div>
    </div>
  );
}

export default memo(TicketCard);
