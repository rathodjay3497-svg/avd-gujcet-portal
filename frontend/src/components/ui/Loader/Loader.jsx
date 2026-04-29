import styles from './Loader.module.css';

export default function Loader({ size = 'md', text = '', fullPage = false }) {
  const containerClass = `${styles.wrapper} ${fullPage ? styles.fullPage : ''}`;
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <svg viewBox="25 25 50 50">
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeMiterlimit="10"
          />
        </svg>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
