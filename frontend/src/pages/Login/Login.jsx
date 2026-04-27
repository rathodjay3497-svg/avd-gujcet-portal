import { useLocation, Navigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
import useAuthStore from '@/store/authStore';

export default function Login() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const redirectTo = location.state?.from || undefined;

  if (isAuthenticated) {
    return <Navigate to={redirectTo || '/'} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoBox}>
          <span className={styles.logoIcon}>GC</span>
        </div>

        <h2 className={styles.title}>Student Login</h2>
        <p className={styles.subtitle}>
          Student login is currently unavailable. Please contact admin for access.
        </p>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.adminLink}>
          <Link to="/admin/login" className={styles.adminLinkText}>
            Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
