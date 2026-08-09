import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchTicketById, addComment } from '../api/ticketsApi';
import { parseApiError } from '../utils/apiError';
import { validateTicketFields } from '../utils/ticketValidation';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { usePatchWithConflict } from '../hooks/usePatchWithConflict';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import ErrorState from '../components/ErrorState/ErrorState';
import PriorityBadge from '../components/Badges/PriorityBadge';
import CategoryBadge from '../components/Badges/CategoryBadge';
import StatusBadge from '../components/Badges/StatusBadge';
import StatusDropdown from '../components/StatusDropdown/StatusDropdown';
import SlaCountdown from '../components/SlaCountdown/SlaCountdown';
import RelativeTime from '../components/RelativeTime/RelativeTime';
import Timeline from '../components/Timeline/Timeline';
import CommentSection from '../components/CommentSection/CommentSection';
import ConflictModal from '../components/ConflictModal/ConflictModal';
import TicketFormFields from '../components/TicketFormFields/TicketFormFields';
import styles from './TicketDetailsPage.module.css';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAgent = user.role === 'agent';
  const { conflict, patchTicket, retryMine, takeTheirs, cancelConflict } = usePatchWithConflict();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchTicketById(id);
      setTicket(res.data);
      setError(null);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  async function handleStatusChange(newStatus) {
    const snapshot = ticket;
    setIsUpdatingStatus(true);
    setTicket((prev) => ({ ...prev, status: newStatus }));

    const result = await patchTicket(ticket._id, snapshot.version, { status: newStatus });

    if (result.success) {
      setTicket(result.ticket);
      showToast(`Ticket moved to ${newStatus}.`, { type: 'success' });
    } else {
      setTicket(snapshot);
      if (!result.isConflict) showToast(result.message, { type: 'error' });
    }
    setIsUpdatingStatus(false);
  }

  function startEditing() {
    setEditForm({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    });
    setEditErrors({});
    setSaveError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditForm(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const validationErrors = validateTicketFields(editForm);
    setEditErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSaveError('');

    const changes = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      category: editForm.category,
      priority: editForm.priority,
    };

    const result = await patchTicket(ticket._id, ticket.version, changes);

    if (result.success) {
      setTicket(result.ticket);
      showToast('Ticket updated.', { type: 'success' });
      setIsEditing(false);
    } else if (!result.isConflict) {
      setSaveError(result.message);
    }
    setIsSaving(false);
  }

  async function handleAddComment(text) {
    try {
      const res = await addComment(ticket._id, text);
      setTicket(res.data);
    } catch (err) {
      throw new Error(parseApiError(err).message);
    }
  }

  async function handleRetryMine() {
    if (!conflict) return;
    const { attemptedChange, currentTicket: lastKnownGood } = conflict;
    const isStatusAttempt = 'status' in attemptedChange;

    if (isStatusAttempt) setIsUpdatingStatus(true);
    else setIsSaving(true);
    setTicket((prev) => ({ ...prev, ...attemptedChange }));

    const result = await retryMine();

    if (result?.success) {
      setTicket(result.ticket);
      showToast('Your change was applied.', { type: 'success' });
      setIsEditing(false);
    } else if (result?.isConflict) {
      // A second conflict replaced `conflict` with a newer snapshot - the modal
      // reopens on its own; just fall back to the last state we know is real.
      setTicket(lastKnownGood);
    } else if (result) {
      setTicket(lastKnownGood);
      showToast(result.message, { type: 'error' });
    }

    if (isStatusAttempt) setIsUpdatingStatus(false);
    else setIsSaving(false);
  }

  function handleTakeTheirs() {
    const serverTicket = takeTheirs();
    if (serverTicket) {
      setTicket(serverTicket);
      setIsEditing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner label="Loading ticket…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        {error.status === 404 ? (
          <div className={`card ${styles.notFound}`}>
            <p>Ticket not found.</p>
            <Link to="/" className="btn btn-secondary btn-sm">
              ← Back to tickets
            </Link>
          </div>
        ) : error.status === 403 ? (
          <div className={`card ${styles.notFound}`}>
            <p>You don&rsquo;t have access to this ticket.</p>
            <Link to="/" className="btn btn-secondary btn-sm">
              ← Back to tickets
            </Link>
          </div>
        ) : (
          <ErrorState message={error.message} onRetry={loadTicket} />
        )}
      </div>
    );
  }

  const isClosed = ticket.status === 'Closed';

  return (
    <div className="page-container">
      <Link to="/" className={`btn btn-ghost btn-sm ${styles.backLink}`}>
        ← Back to tickets
      </Link>

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={`card ${styles.detailsCard}`}>
            <div className={styles.badgeRow}>
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
              <SlaCountdown slaDeadline={ticket.slaDeadline} slaState={ticket.slaState} />
            </div>

            {isEditing ? (
              <EditForm
                form={editForm}
                errors={editErrors}
                isSaving={isSaving}
                saveError={saveError}
                onChange={(field, value) => {
                  setEditForm((prev) => ({ ...prev, [field]: value }));
                  setEditErrors((prev) => ({ ...prev, [field]: undefined }));
                }}
                onSubmit={handleSaveEdit}
                onCancel={cancelEditing}
              />
            ) : (
              <>
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>{ticket.title}</h1>
                  {isAgent && !isClosed && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={startEditing}>
                      Edit
                    </button>
                  )}
                </div>
                <p className={styles.description}>{ticket.description}</p>
              </>
            )}

            <div className={styles.metaGrid}>
              <div>
                <span className={styles.metaLabel}>Assigned Agent</span>
                <span className={styles.metaValue}>
                  {ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned (Queued)'}
                </span>
              </div>
              {isAgent && (
                <div>
                  <span className={styles.metaLabel}>Filed By</span>
                  <span className={styles.metaValue}>{ticket.createdBy ? ticket.createdBy.name : 'Unknown'}</span>
                </div>
              )}
              <div>
                <span className={styles.metaLabel}>Created</span>
                <span className={styles.metaValue}>
                  <RelativeTime date={ticket.createdAt} />
                </span>
              </div>
              <div>
                <span className={styles.metaLabel}>Last Updated</span>
                <span className={styles.metaValue}>
                  <RelativeTime date={ticket.updatedAt} />
                </span>
              </div>
              <div>
                <span className={styles.metaLabel}>Version</span>
                <span className={styles.metaValue}>{ticket.version}</span>
              </div>
            </div>

            <div className={styles.statusRow}>
              <span className={styles.metaLabel}>Status</span>
              {isAgent ? (
                <StatusDropdown status={ticket.status} isUpdating={isUpdatingStatus} onChangeStatus={handleStatusChange} />
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>
          </div>

          <div className={`card ${styles.commentsCard}`}>
            <CommentSection comments={ticket.comments} isClosed={isClosed} onAddComment={handleAddComment} />
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={`card ${styles.timelineCard}`}>
            <h3 className={styles.sectionHeading}>Activity Timeline</h3>
            <Timeline history={ticket.history} />
          </div>
        </div>
      </div>

      <ConflictModal
        isOpen={!!conflict}
        attemptedChange={conflict?.attemptedChange}
        currentTicket={conflict?.currentTicket}
        onRetryMine={handleRetryMine}
        onTakeTheirs={handleTakeTheirs}
        onCancel={cancelConflict}
      />
    </div>
  );
}

function EditForm({ form, errors, isSaving, saveError, onChange, onSubmit, onCancel }) {
  return (
    <form className={styles.editForm} onSubmit={onSubmit} noValidate>
      <TicketFormFields form={form} errors={errors} onChange={onChange} idPrefix="edit" />

      {saveError && <p className="field-error">{saveError}</p>}

      <div className={styles.editActions}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
          {isSaving ? <LoadingSpinner inline size={14} label="" /> : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
