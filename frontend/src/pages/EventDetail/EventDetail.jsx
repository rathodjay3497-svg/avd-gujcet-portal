import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvent';
import { useCheckRegistration } from '@/hooks/useRegistration';
import Badge from '@/components/ui/Badge/Badge';
import EventBadge from '@/components/events/EventBadge/EventBadge';
import Loader from '@/components/ui/Loader/Loader';
import { STREAM_COLORS } from '@/constants/streams';
import { formatDate } from '@/utils/formatters';
import useAuthStore from '@/store/authStore';
import styles from './EventDetail.module.css';

export default function EventDetail() {
  const { eventId } = useParams();
  const { data: event, isLoading, error } = useEvent(eventId);
  const { isAuthenticated, user } = useAuthStore();
  const { data: checkData } = useCheckRegistration(eventId);

  const isAlreadyRegistered = checkData?.registered;

  if (isLoading) return <Loader text="Loading event details..." />;
  if (error || !event) return <div className={styles.error}>Event not found</div>;

  const isClickRegister = event.registration_type === 'click_to_register';
  const isClosed = event.status === 'closed';

  const getRegisterLink = () => {
    if (isAlreadyRegistered) return '/profile';
    if (isClosed) return null;
    if (isClickRegister) {
      return isAuthenticated ? `/events/${eventId}/confirm` : '/login';
    }
    return `/events/${eventId}/register`;
  };

  const getRegisterText = () => {
    if (isAlreadyRegistered) return 'Already Registered — View Details';
    if (isClosed) return 'Registration Closed';
    if (isClickRegister && !isAuthenticated) return 'Login to Register';
    if (isClickRegister) return 'Register Now — 1 Click';
    return 'Register Now';
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Left — Details */}
          <div className={styles.details}>
            <div className={styles.breadcrumb}>
              <Link to="/">Home</Link> / <Link to="/#events">Events</Link> / {event.title}
            </div>

            <h1 className={styles.title}>{event.title}</h1>

            <div className={styles.metaRow}>
              <EventBadge status={event.status} />
              <span className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDate(event.start_date)}{event.end_date ? ` - ${formatDate(event.end_date)}` : ''}
              </span>
              <span className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.venue}
              </span>
              <span className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                  <line x1="12" y1="12" x2="12" y2="12"></line>
                  <path d="M6 12h.01M18 12h.01"></path>
                </svg>
                {event.fee === 0 || !event.fee ? 'Free' : `₹${event.fee}`}
              </span>
            </div>

            <div className={styles.streams}>
              {event.streams?.map((s) => (
                <Badge key={s} color={STREAM_COLORS[s]}>{s}</Badge>
              ))}
            </div>

            <div className={styles.description}>
              <h3>About This Event</h3>
              <p>{event.description || 'Join us for expert counseling on college admissions after GUJCET. Our experienced counselors will guide you through the admission process, college selection, and career planning.'}</p>
            </div>

            <div className={styles.infoBox}>
              <h3>What to Bring</h3>
              <ul>
                <li>Printed or digital copy of your admit card</li>
                <li>Valid photo ID (Aadhaar, school ID)</li>
                <li>GUJCET score card (if available)</li>
                <li>Pen and notebook for notes</li>
              </ul>
            </div>

            {event.registration_deadline && (
              <p className={styles.deadline}>
                Registration deadline: <strong>{formatDate(event.registration_deadline)}</strong>
              </p>
            )}

          </div>

          {/* Right — Sticky Registration Card */}
          <div className={styles.sidebar}>
            <div className={styles.registerCard}>
              <h3>{event.title}</h3>
              <p className={styles.cardDate}>{formatDate(event.start_date)}{event.end_date ? ` - ${formatDate(event.end_date)}` : ''}</p>
              <p className={styles.cardDate}>Fee: {event.fee === 0 || !event.fee ? 'Free' : `₹${event.fee}`}</p>

              <div style={{ textAlign: 'center' }}>
                {getRegisterLink() ? (
                  <Link to={getRegisterLink()} className={isAlreadyRegistered ? styles.registeredBtn : styles.registerBtn}>
                    {getRegisterText()}
                  </Link>
                ) : (
                  <button className={styles.registerBtn} disabled>
                    {getRegisterText()}
                  </button>
                )}
              </div>

              {!isAlreadyRegistered && (
                <p className={styles.checkStatus}>
                  Already registered? <Link to="/profile">Check status</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
