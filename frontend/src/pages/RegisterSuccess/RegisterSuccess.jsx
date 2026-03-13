import { useLocation, Link } from 'react-router-dom';
import styles from './RegisterSuccess.module.css';

const WHATSAPP_LINK = 'https://chat.whatsapp.com/GdodTpblcTz54g3X8XWBGJ?mode=gi_t';

function WhatsAppIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        d="M23.4 8.6A10.2 10.2 0 0 0 16 5.8C10.4 5.8 5.8 10.4 5.8 16c0 1.8.5 3.6 1.4 5.2L5.6 26.8l5.8-1.5A10.2 10.2 0 0 0 16 26.2c5.6 0 10.2-4.6 10.2-10.2 0-2.7-1.1-5.3-2.8-7.4zM16 24.4a8.4 8.4 0 0 1-4.3-1.2l-.3-.2-3.4.9.9-3.3-.2-.3A8.5 8.5 0 0 1 7.6 16c0-4.6 3.8-8.4 8.4-8.4 2.3 0 4.4.9 6 2.4a8.3 8.3 0 0 1 2.4 6c0 4.7-3.8 8.4-8.4 8.4zm4.6-6.3c-.3-.1-1.6-.8-1.8-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1-.2.1-.4.2-.7 0-.3-.1-1.2-.4-2.3-1.4a8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.2-.4v-.4l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2 0-.1-.3-.2-.6-.3z"
        fill="#fff"
      />
    </svg>
  );
}

export default function RegisterSuccess() {
  const { state } = useLocation();
  const regId = state?.registrationId || 'N/A';
  const eventTitle = state?.eventTitle;
  const userName = state?.userName;
  const userPhone = state?.userPhone;
  const userStream = state?.userStream;
  const userSchool = state?.userSchool;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(regId);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* ── Animated Checkmark ── */}
        <div className={styles.checkmark}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3" className={styles.circle} />
            <path d="M24 40 L35 51 L56 30" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.check} />
          </svg>
        </div>

        <h1 className={styles.title}>🎉 You are Registered!</h1>
        <p className={styles.subtitle}>
          {userName ? `Congratulations ${userName}! ` : ''}Your registration has been confirmed.
        </p>

        {/* ── Registration ID ── */}
        <div className={styles.regIdBox}>
          <span className={styles.regIdLabel}>Your Registration ID</span>
          <div className={styles.regIdRow}>
            <span className={styles.regId}>{regId}</span>
            <button onClick={copyToClipboard} className={styles.copyBtn} title="Copy ID">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Student Summary ── */}
        {(userPhone || userStream || userSchool || eventTitle) && (
          <div className={styles.summary}>
            {eventTitle && <div className={styles.summaryRow}><span className={styles.summaryKey}>Event</span><span className={styles.summaryVal}>{eventTitle}</span></div>}
            {userPhone && <div className={styles.summaryRow}><span className={styles.summaryKey}>Phone</span><span className={styles.summaryVal}>+91 {userPhone}</span></div>}
            {userStream && <div className={styles.summaryRow}><span className={styles.summaryKey}>Stream</span><span className={styles.summaryVal}>{userStream}</span></div>}
            {userSchool && <div className={styles.summaryRow}><span className={styles.summaryKey}>School / College</span><span className={styles.summaryVal}>{userSchool}</span></div>}
          </div>
        )}

        {/* ── WhatsApp CTA ── */}
        <div className={styles.waCard}>
          <div className={styles.waCardHeader}>
            <WhatsAppIcon />
            <div>
              <p className={styles.waTitle}>Join Our WhatsApp Group</p>
              <p className={styles.waDesc}>Get updates, schedules &amp; important announcements directly on WhatsApp.</p>
            </div>
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
          >
            <WhatsAppIcon />
            Join WhatsApp Group Now
          </a>
        </div>

        {/* ── Register Another ── */}
        <div className={styles.actions}>
          <Link to="/" className={styles.backBtn}>
            ← Register Another Student / Back to Events
          </Link>
        </div>

      </div>
    </div>
  );
}
