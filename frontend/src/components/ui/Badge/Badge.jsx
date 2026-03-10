import styles from './Badge.module.css';

export default function Badge({ children, variant = 'default', color }) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]}`}
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}
    >
      {children}
    </span>
  );
}
