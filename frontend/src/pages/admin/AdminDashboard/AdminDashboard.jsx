import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import { eventsAPI, adminAPI } from '@/services/api';
import styles from './AdminDashboard.module.css';

function sortEvents(events) {
  const now = new Date();
  const order = (e) => {
    if (e.status === 'active') return 0;
    const d = e.start_date ? new Date(e.start_date) : null;
    if (e.status !== 'closed' && d && d > now) return 1;
    return 2;
  };
  return [...events].sort((a, b) => {
    const diff = order(a) - order(b);
    if (diff !== 0) return diff;
    const da = a.start_date ? new Date(a.start_date) : new Date(0);
    const db = b.start_date ? new Date(b.start_date) : new Date(0);
    return da - db;
  });
}

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, overviewRes] = await Promise.all([
          eventsAPI.list(''),
          adminAPI.getOverview(),
        ]);
        setEvents(eventsRes.data);
        setOverview(overviewRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const countMap = useMemo(() => {
    const m = {};
    (overview?.events_with_counts || []).forEach(({ event_id, registration_count }) => {
      m[event_id] = registration_count;
    });
    return m;
  }, [overview]);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const totalRegs = overview?.total_registrations ?? 0;

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <h1 className={styles.pageTitle}>Dashboard</h1>

        {loading ? (
          <Loader text="Loading dashboard..." />
        ) : (
          <>
            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
              <KpiCard label="Total Registrations" value={totalRegs} color="#2563EB" />
              <KpiCard label="Total Events" value={events.length} color="#10B981" />
              <KpiCard
                label="Active Events"
                value={events.filter(e => e.status === 'active').length}
                color="#F59E0B"
              />
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
                      <th className={styles.thRight}>Registrations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEvents.map((event) => (
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
                        <td className={styles.tdRight}>
                          <span className={styles.countBadge}>
                            {countMap[event.event_id] ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sortedEvents.length === 0 && (
                      <tr><td colSpan={5} className={styles.emptyRow}>No events yet</td></tr>
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
