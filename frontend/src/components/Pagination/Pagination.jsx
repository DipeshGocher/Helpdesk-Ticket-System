import { memo } from 'react';
import styles from './Pagination.module.css';

function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, totalPages, totalItems } = pagination;

  if (totalItems === 0) return null;

  const pageNumbers = getPageWindow(page, totalPages);

  return (
    <div className={styles.wrap}>
      <span className={styles.summary}>
        Page {page} of {totalPages} · {totalItems} ticket{totalItems === 1 ? '' : 's'}
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>

        {pageNumbers.map((p, idx) =>
          p === '…' ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default memo(Pagination);

function getPageWindow(current, total, windowSize = 5) {
  if (total <= windowSize + 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);

  return pages;
}
