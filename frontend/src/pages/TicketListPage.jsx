import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTickets, fetchTicketStats } from '../api/ticketsApi';
import { parseApiError } from '../utils/apiError';
import { mergeTicketLists } from '../utils/ticketDiff';
import { useToast } from '../context/ToastContext';
import { useInterval } from '../hooks/useInterval';
import { usePatchWithConflict } from '../hooks/usePatchWithConflict';
import StatsBar from '../components/StatsBar/StatsBar';
import Filters from '../components/Filters/Filters';
import SearchBar from '../components/SearchBar/SearchBar';
import Pagination from '../components/Pagination/Pagination';
import TicketCard from '../components/TicketCard/TicketCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import ErrorState from '../components/ErrorState/ErrorState';
import ConflictModal from '../components/ConflictModal/ConflictModal';
import styles from './TicketListLayout.module.css';

const POLL_INTERVAL_MS = 5000;
const PAGE_SIZE = 6;
const DEFAULT_FILTERS = { status: '', priority: '', sortBy: 'createdAt', sortOrder: 'desc' };

export default function TicketListPage() {
  const { showToast } = useToast();
  const { conflict, patchTicket, retryMine, takeTheirs, cancelConflict } = usePatchWithConflict();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetKey, setResetKey] = useState(0); // bumped only by "Clear filters" to remount SearchBar

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState('');

  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  // Polling needs the latest list without re-subscribing the interval callback.
  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;

  const buildParams = useCallback(
    () => ({
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page,
      limit: PAGE_SIZE,
    }),
    [filters, search, page]
  );

  const loadTickets = useCallback(
    async ({ isPoll = false } = {}) => {
      if (!isPoll) setIsLoading(true);
      try {
        const res = await fetchTickets(buildParams());

        if (isPoll) {
          const { merged, changedCount } = mergeTicketLists(ticketsRef.current, res.data);
          if (changedCount > 0) {
            setTickets(merged);
            setPagination(res.pagination);
            showToast(`${changedCount} ticket${changedCount === 1 ? '' : 's'} updated`, { type: 'info' });
          }
        } else {
          setTickets(res.data);
          setPagination(res.pagination);
        }
        setError('');
      } catch (err) {
        if (!isPoll) setError(parseApiError(err).message);
      } finally {
        if (!isPoll) setIsLoading(false);
      }
    },
    [buildParams, showToast]
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchTicketStats();
      setStats(res.data);
    } catch {
      // Stats are supplementary - a failed refresh shouldn't disrupt the ticket list.
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useInterval(() => {
    loadTickets({ isPoll: true });
    loadStats();
  }, POLL_INTERVAL_MS);

  const handleFilterChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    setPage(1);
    setResetKey((k) => k + 1);
  }, []);

  const markUpdating = useCallback((ticketId, isUpdating) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (isUpdating) next.add(ticketId);
      else next.delete(ticketId);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (ticketId, newStatus) => {
      const snapshot = ticketsRef.current.find((t) => t._id === ticketId);
      if (!snapshot) return;

      markUpdating(ticketId, true);
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t)));

      const result = await patchTicket(ticketId, snapshot.version, { status: newStatus });

      if (result.success) {
        setTickets((prev) => prev.map((t) => (t._id === ticketId ? result.ticket : t)));
        showToast(`Ticket moved to ${newStatus}.`, { type: 'success' });
        loadStats();
      } else {
        // Roll back to the pre-attempt snapshot either way - if it was a conflict,
        // the modal takes over from here (Retry Mine / Take Latest / Cancel).
        setTickets((prev) => prev.map((t) => (t._id === ticketId ? snapshot : t)));
        if (!result.isConflict) showToast(result.message, { type: 'error' });
      }
      markUpdating(ticketId, false);
    },
    [markUpdating, patchTicket, showToast, loadStats]
  );

  const handleRetryMine = useCallback(async () => {
    if (!conflict) return;
    const { ticketId, attemptedChange } = conflict;

    markUpdating(ticketId, true);
    setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, ...attemptedChange } : t)));

    const result = await retryMine();

    if (result?.success) {
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? result.ticket : t)));
      showToast('Your change was applied.', { type: 'success' });
      loadStats();
    } else if (result && !result.isConflict) {
      showToast(result.message, { type: 'error' });
    }
    // On a repeat conflict, `conflict` is already replaced with the newer snapshot
    // by retryMine() and the modal reopens - no local rollback needed here.
    markUpdating(ticketId, false);
  }, [conflict, retryMine, markUpdating, showToast, loadStats]);

  const handleTakeTheirs = useCallback(() => {
    const ticket = takeTheirs();
    if (ticket) setTickets((prev) => prev.map((t) => (t._id === ticket._id ? ticket : t)));
  }, [takeTheirs]);

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <h1>Tickets</h1>
      </div>

      <StatsBar stats={stats} isLoading={isStatsLoading} />

      <div className={`card ${styles.controlsBar}`}>
        <SearchBar key={resetKey} initialValue={search} onSearch={handleSearch} />
        <Filters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading tickets…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadTickets()} />
      ) : tickets.length === 0 ? (
        <div className={`card ${styles.emptyState}`}>
          <p>No tickets match your filters.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                isUpdating={updatingIds.has(ticket._id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

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
