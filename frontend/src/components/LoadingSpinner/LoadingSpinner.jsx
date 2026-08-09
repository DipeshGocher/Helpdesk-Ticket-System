import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 24, label = 'Loading', inline = false }) {
  return (
    <div className={inline ? styles.inlineWrap : styles.wrap} role="status" aria-label={label}>
      <span
        className={styles.spinner}
        style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 8)) }}
      />
      {!inline && label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
