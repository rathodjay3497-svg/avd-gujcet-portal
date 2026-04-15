import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
          <img src="/assets/logo.jpeg" alt="Suhrad Youths Logo" className={styles.logoImg} />
          <span className={styles.logoText}>Suhrad Youths</span>
        </Link>

        <div className={styles.mobileHeaderActions}>
          <Link
            to="/help-desk"
            className={`${styles.liveLink} ${styles.liveLinkDesk} ${styles.mobileHelpLink} ${location.pathname === '/help-desk' ? styles.active : ''}`}
          >
            <span className={`${styles.liveDot} ${styles.liveDotGoogleAi}`} />
            Admission Help Desk
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
        </div>

        <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={location.pathname === '/' ? styles.active : ''}
          >
            Home
          </Link>
          <Link
            to="/#events"
            onClick={() => {
              if (location.pathname === '/') {
                setTimeout(() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }
            }}
          >
            Events
          </Link>
          <Link
            to="/help-desk"
            className={`${styles.liveLink} ${styles.liveLinkDesk} ${location.pathname === '/help-desk' ? styles.active : ''}`}
          >
            <span className={`${styles.liveDot} ${styles.liveDotGoogleAi}`} />
            Admission Help Desk
          </Link>

          <Link
            to="/hpcl-2026"
            className={`${styles.liveLink} ${styles.liveLinkHpcl} ${location.pathname === '/hpcl-2026' ? styles.active : ''}`}
          >
            <span className={`${styles.liveDot} ${styles.liveDotGreen}`} />
            HPCL Cricket
          </Link>

          <Link
            to="/events/gujcet-2026"
            className={location.pathname === '/events/gujcet-2026' ? styles.active : ''}
          >
            GUJCET Preparation
          </Link>



        </div>
      </div>
    </nav>
  );
}
