import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { eventsAPI } from '@/services/api';
import { useAdminEvents } from '@/hooks/useEvent';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './ManageEvents.module.css';

export default function ManageEvents() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useAdminEvents();

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const s = search.toLowerCase();
    return events.filter(e =>
      e.title?.toLowerCase().includes(s) ||
      e.status?.toLowerCase().includes(s) ||
      e.venue?.toLowerCase().includes(s) ||
      e.registration_type?.toLowerCase().includes(s)
    );
  }, [events, search]);

  const toggleStatus = async (eventId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await eventsAPI.updateStatus(eventId, newStatus);
      toast.success(`Event marked as ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <div className={styles.header}>
          <h1>Manage Events</h1>
          <Link to="/admin/events/new">
            <Button>+ New Event</Button>
          </Link>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, status, venue…"
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <span className={styles.eventCount}>
            {filtered.length} / {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {search ? `No events match "${search}".` : 'No events yet. Create one!'}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((event) => (
              <div key={event.event_id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{event.title}</h3>
                  <span className={`${styles.status} ${styles[event.status]}`}>
                    {event.status}
                  </span>
                </div>

                <p className={styles.meta}>
                  {formatDate(event.start_date)}
                  {event.end_date ? ` – ${formatDate(event.end_date)}` : ''}
                  {event.venue ? ` · ${event.venue}` : ''}
                </p>
                <p className={styles.meta}>
                  Type: {event.registration_type} · Fee:{' '}
                  {event.fee === 0 || !event.fee ? 'Free' : `₹${event.fee}`}
                </p>

                {event.seat_limit > 0 && (
                  <div className={styles.seatsRow}>
                    <div className={styles.seatsBar}>
                      <div
                        className={styles.seatsFill}
                        style={{ width: `${Math.min(100, ((event.seat_filled || 0) / event.seat_limit) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.seatsMeta}>
                      {event.seat_filled || 0} / {event.seat_limit} seats
                    </span>
                  </div>
                )}

                <div className={styles.cardActions}>
                  <Link to={`/admin/events/${event.event_id}/registrations`}>
                    Registrations
                  </Link>
                  <Link to={`/admin/events/${event.event_id}/edit`}>Edit</Link>
                  <button onClick={() => toggleStatus(event.event_id, event.status)}>
                    {event.status === 'active' ? 'Close' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
