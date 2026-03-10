import styles from './EmptyState.module.css';

export default function EmptyState({ title = 'Nothing here yet', message = '', action }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
