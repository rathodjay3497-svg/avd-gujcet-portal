import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
    // Update a CSS variable on the document root so other components can react
    document.documentElement.style.setProperty('--admin-sidebar-width', isCollapsed ? '64px' : '240px');
    if (isCollapsed) {
      document.body.classList.add('admin-sidebar-collapsed');
    } else {
      document.body.classList.remove('admin-sidebar-collapsed');
    }
  }, [isCollapsed]);

  const toggle = () => setIsCollapsed(!isCollapsed);

  const links = [
    { to: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/admin/events', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/admin/hpcl-registrations', label: 'HPCL Cricket', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z' },
  ];

  return (
    <>
      {/* Hamburger Button - Top Left */}
      <button 
        className={styles.hamburger} 
        onClick={toggle}
        aria-label="Toggle Sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isCollapsed ? (
            <path d="M4 6h16M4 12h16M4 18h16" />
          ) : (
            <path d="M18 6L6 18M6 6l12 12" />
          )}
        </svg>
      </button>

      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>GC</span>
          {!isCollapsed && <span className={styles.logoText}>Admin</span>}
        </div>

        <nav className={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              title={isCollapsed ? link.label : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} className={styles.logoutBtn} title={isCollapsed ? 'Logout' : ''}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>
    </>
  );
}
