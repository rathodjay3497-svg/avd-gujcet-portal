import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { eventsAPI } from '@/services/api';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './ManageEvents.module.css';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const { data } = await eventsAPI.list('');
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const toggleStatus = async (eventId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await eventsAPI.updateStatus(eventId, newStatus);
      toast.success(`Event ${newStatus}`);
      fetchEvents();
    } catch (err) {
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

        {loading ? (
          <Loader />
        ) : (
          <div className={styles.grid}>
            {events.map((event) => (
              <div key={event.event_id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{event.title}</h3>
                  <span className={`${styles.status} ${styles[event.status]}`}>
                    {event.status}
                  </span>
                </div>
                <p className={styles.meta}>{formatDate(event.start_date)}{event.end_date ? ` - ${formatDate(event.end_date)}` : ''} &bull; {event.venue}</p>
                <p className={styles.meta}>Type: {event.registration_type} &bull; Fee: {event.fee === 0 || !event.fee ? 'Free' : `₹${event.fee}`}</p>

                <div className={styles.cardActions}>
                  <Link to={`/admin/events/${event.event_id}/edit`}>Edit</Link>
                  <Link to={`/admin/events/${event.event_id}/registrations`}>Registrations</Link>
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
