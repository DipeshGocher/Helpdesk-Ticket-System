import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTickets } from '../api/ticketsApi';
import { parseApiError } from '../utils/apiError';
import { mergeTicketLists } from '../utils/ticketDiff';
import { useToast } from '../context/ToastContext';
import { useInterval } from '../hooks/useInterval';
import Filters from '../components/Filters/Filters';
import SearchBar from '../components/SearchBar/SearchBar';
import Pagination from '../components/Pagination/Pagination';
import TicketCard from '../components/TicketCard/TicketCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import ErrorState from '../components/ErrorState/ErrorState';
import styles from './TicketListLayout.module.css';

const POLL_INTERVAL_MS = 5000;
const PAGE_SIZE = 6;
const DEFAULT_FILTERS = { status: '', priority: '', sortBy: 'createdAt', sortOrder: 'desc' };

// A customer's own ticket list - no stats bar (that's an ops view), no status
// dropdown (customers can't resolve tickets, only agents can - see TicketCard's
// `readOnly` prop). The backend already scopes GET /tickets to the caller's own
// tickets when the requester is a customer, so no client-side filtering is needed here.
export default function CustomerTicketListPage() {
  const { showToast } = useToast();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, page]);

  useInterval(() => {
    loadTickets({ isPoll: true });
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

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <h1>My Tickets</h1>
      </div>

      <div className={`card ${styles.controlsBar}`}>
        <SearchBar key={resetKey} initialValue={search} onSearch={handleSearch} />
        <Filters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading your tickets…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadTickets()} />
      ) : tickets.length === 0 ? (
        <div className={`card ${styles.emptyState}`}>
          <p>You haven&rsquo;t filed any tickets yet.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {tickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} readOnly />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
