import { useLocation, Navigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import useAuthStore from '@/store/authStore';
import styles from './Login.module.css';

export default function Login() {
  const { googleLogin, loading } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const redirectTo = location.state?.from || undefined;

  if (isAuthenticated) {
    return <Navigate to={redirectTo || '/'} replace />;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    await googleLogin(credentialResponse.credential, redirectTo);
  };

  const handleGoogleError = () => {
    // GoogleLogin component shows its own error UI; nothing extra needed here
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoBox}>
          <span className={styles.logoIcon}>GC</span>
        </div>

        <h2 className={styles.title}>Student Login</h2>
        <p className={styles.subtitle}>
          Sign in with your Google account to register for counseling events
        </p>

        <div className={styles.googleWrapper}>
          {loading ? (
            <div className={styles.loadingText}>Signing in…</div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="340"
            />
          )}
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.adminLink}>
          <Link to="/admin/login" className={styles.adminLinkText}>
            Admin login
          </Link>
        </div>

        <p className={styles.disclaimer}>
          Your Google account email will be used as your login identifier.
          You can add your mobile number in your profile after signing in.
        </p>
      </div>
    </div>
  );
}
