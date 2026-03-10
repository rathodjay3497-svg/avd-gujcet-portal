import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Carousel from '@/components/ui/Carousel/Carousel';
import { eventsAPI, adminAPI } from '@/services/api';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const eventsRes = await eventsAPI.list('');
        setEvents(eventsRes.data);

        // Get stats for the first event if exists
        if (eventsRes.data.length > 0) {
          const statsRes = await adminAPI.getStats(eventsRes.data[0].event_id);
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalRegs = stats?.total_registrations || 0;
  const byStream = stats?.by_stream || {};

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <h1 className={styles.pageTitle}>Dashboard</h1>

        {loading ? (
          <Loader text="Loading dashboard..." />
        ) : (
          <>
            {/* Image Placeholder Carousel */}
            <Carousel />

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
              <KpiCard label="Total Registrations" value={totalRegs} color="#2563EB" />
              <KpiCard label="Science" value={byStream.Science || 0} color="#2563EB" />
              <KpiCard label="Commerce" value={byStream.Commerce || 0} color="#10B981" />
              <KpiCard label="Arts" value={byStream.Arts || 0} color="#F59E0B" />
            </div>

            {/* Events Table */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Events</h2>
                <Link to="/admin/events/new" className={styles.addBtn}>+ New Event</Link>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.event_id}>
                        <td><strong>{event.title}</strong></td>
                        <td>{event.start_date?.slice(0, 10)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[event.status]}`}>
                            {event.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Link to={`/admin/events/${event.event_id}/registrations`}>View</Link>
                            <Link to={`/admin/events/${event.event_id}/edit`}>Edit</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr><td colSpan={4} className={styles.emptyRow}>No events yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon} style={{ backgroundColor: `${color}15`, color }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      </div>
      <div>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiLabel}>{label}</p>
      </div>
    </div>
  );
}
