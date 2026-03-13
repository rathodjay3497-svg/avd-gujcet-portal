import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge/Badge';
import { STREAM_COLORS } from '@/constants/streams';
import { formatDate, formatTime } from '@/utils/formatters';
import RegisterButton from '@/components/events/RegisterButton/RegisterButton';
import styles from './EventCard.module.css';

export default function EventCard({ event }) {
  const streamColor = STREAM_COLORS[event.streams?.[0]] || '#2563EB';

  return (
    <div className={styles.card} style={{ borderTopColor: streamColor }}>
      <div className={styles.body}>
        <h3 className={styles.title}>
          {event.title}
          {event.future_scope ? (
            <span className={styles.futureBadge}>Coming soon</span>
          ) : (
            <span className={styles.liveBadge} title="Active Event">
              <span className={styles.blinkingDot}></span> Live
            </span>
          )}
        </h3>
        {event.organized_by && (
          <p className={styles.organizedBy}>
            <strong>Organized by:</strong> {event.organized_by}
          </p>
        )}

        <div className={styles.meta}>
          {event.start_date && (
            <span className={styles.date}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(event.start_date)}{event.end_date ? ` - ${formatDate(event.end_date)}` : ''}
            </span>
          )}
          {event.start_time && (
            <span className={styles.date}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatTime(event.start_time)}{event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
            </span>
          )}
          {event.venue && (
            <span className={styles.venue}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.venue}
            </span>
          )}
          {(event.fee !== undefined && event.fee !== null && event.fee >= 0) && (
            <span className={styles.venue}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                <line x1="12" y1="12" x2="12" y2="12"></line>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
              {event.fee === 0 || !event.fee ? 'Free' : `₹${event.fee}`}
            </span>
          )}
          {event.contact_details && (
            <span className={styles.venue}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              {event.contact_details}
            </span>
          )}
        </div>

        <div className={styles.streams}>
          {event.streams?.map((s) => (
            <Badge key={s} color={STREAM_COLORS[s]}>{s}</Badge>
          ))}
        </div>

      </div>

      {!event.future_scope && (
        <div className={styles.footer}>
          <RegisterButton event={event} />
        </div>
      )}
    </div>
  );
}
