import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import useAuthStore from '@/store/authStore';

export default function Footer() {
  const { isAuthenticated, isAdmin } = useAuthStore();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              {/* <span className={styles.logoIcon}>GC</span> */}
              <span>Admission Help Desk</span>
            </div>
            <p>Expert guidance for Admission Help Desk to help students build successful careers.</p>
          </div>

          <div className={styles.links}>
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            {!isAuthenticated ? (
              <>
                {/* <Link to="/login">Student Login</Link> */}
                <Link to="/admin/login">Admin</Link>
              </>
            ) : isAdmin ? (
              <Link to="/admin">Admin Dashboard</Link>
            ) : (
              <Link to="/profile">My Profile</Link>
            )}
          </div>

          <div className={styles.contact}>
            <h4>Contact</h4>
            <p>{'+91 95586 10369'}</p>
            <p>{'+91 77788 88198'}</p>
            <p>{'anandclasses369@gmail.com'}</p>
            <p>Anand, Gujarat, India</p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Admission Help Desk Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
