import { memo, useEffect, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import styles from './SearchBar.module.css';

// Debounces locally, then reports the settled value up via onSearch. Keeping the raw
// input value local (not lifted) means keystrokes never wait on parent re-renders.
function SearchBar({ initialValue = '', onSearch, placeholder = 'Search tickets...' }) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebouncedValue(value, 400);

  useEffect(() => {
    onSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={styles.wrap}>
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search tickets"
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => setValue('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default memo(SearchBar);
