import styles from './Toast.module.css';

const ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
};

export default function Toast({ toast, onDismiss }) {
  return (
    <div className={`${styles.toast} ${styles[toast.type] || styles.info}`} role="status">
      <span className={styles.icon}>{ICONS[toast.type] || ICONS.info}</span>
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
