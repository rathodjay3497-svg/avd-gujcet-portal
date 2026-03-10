import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>GC</span>
          <span className={styles.logoText}>GUJCET Counseling</span>
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.active : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={location.pathname === '/' ? styles.active : ''}>
            Home
          </Link>
          <Link to="/#events" onClick={() => {
            if (location.pathname === '/') {
              setTimeout(() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
          }}>Events</Link>
          <Link to="/#faq" onClick={() => {
            if (location.pathname === '/') {
              setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
          }}>FAQ</Link>
          <Link to="/events/gujcet-2026" className={location.pathname === '/events/gujcet-2026' ? styles.active : ''}>
            Gujcet Preparation
          </Link>
          <Link to="/help-desk" className={location.pathname === '/help-desk' ? styles.active : ''}>
            Admission help desk
          </Link>

          {isAuthenticated ? (
            <div className={styles.authGroup}>
              <Link to="/profile" className={styles.profileLink}>
                {user?.name || 'Profile'}
              </Link>
              <button onClick={logout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
