import { useLocation, Link } from 'react-router-dom';
import { formatDate } from '@/utils/formatters';
import { generateAdmitCardPdf } from '@/utils/generateAdmitCardPdf';
import Button from '@/components/ui/Button/Button';
import styles from './RegisterSuccess.module.css';

export default function RegisterSuccess() {
  const { state } = useLocation();
  const regId = state?.registrationId || 'N/A';
  const eventTitle = state?.eventTitle;
  const eventVenue = state?.eventVenue;
  const eventDate = state?.eventDate;
  const eventEndDate = state?.eventEndDate;
  const eventFee = state?.eventFee;
  const organizedBy = state?.organizedBy;
  const userName = state?.userName;
  const userPhone = state?.userPhone;
  const userEmail = state?.userEmail;
  const userStream = state?.userStream;
  const userSchool = state?.userSchool;
  const userAddress = state?.userAddress;
  const userMedium = state?.userMedium;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(regId);
  };

  const handleDownloadPdf = () => {
    const doc = generateAdmitCardPdf({
      regId,
      eventTitle,
      eventVenue,
      eventDate,
      eventEndDate,
      eventFee,
      organizedBy,
      userName,
      userPhone,
      userEmail,
      userStream,
      userSchool,
      userAddress,
      userMedium,
    });
    doc.save(`Admit-Card-${regId}.pdf`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Animated Checkmark */}
        <div className={styles.checkmark}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#10B981" strokeWidth="3" className={styles.circle} />
            <path d="M24 40 L35 51 L56 30" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.check} />
          </svg>
        </div>

        <h1 className={styles.title}>Registration Successful!</h1>

        {/* Registration ID */}
        <div className={styles.regIdBox}>
          <span className={styles.regIdLabel}>Your Registration ID</span>
          <div className={styles.regIdRow}>
            <span className={styles.regId}>{regId}</span>
            <button onClick={copyToClipboard} className={styles.copyBtn} title="Copy">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Admit Card Preview */}
        <div className={styles.admitCard}>
          <div className={styles.admitHeader}>
            <h3>Admit Card</h3>
          </div>

          <div className={styles.admitBody}>
            {/* Event Details */}
            <div className={styles.admitSection}>
              <h4 className={styles.admitSectionTitle}>Event Details</h4>
              <div className={styles.admitGrid}>
                {eventTitle && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Event</span>
                    <span className={styles.admitValue}>{eventTitle}</span>
                  </div>
                )}
                {organizedBy && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Organized By</span>
                    <span className={styles.admitValue}>{organizedBy}</span>
                  </div>
                )}
                {eventDate && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Date</span>
                    <span className={styles.admitValue}>
                      {formatDate(eventDate)}{eventEndDate ? ` - ${formatDate(eventEndDate)}` : ''}
                    </span>
                  </div>
                )}
                {eventVenue && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Venue</span>
                    <span className={styles.admitValue}>{eventVenue}</span>
                  </div>
                )}
                <div className={styles.admitField}>
                  <span className={styles.admitLabel}>Fee</span>
                  <span className={styles.admitValue}>{eventFee === 0 || !eventFee ? 'Free' : `Rs. ${eventFee}`}</span>
                </div>
              </div>
            </div>

            {/* Student Details */}
            <div className={styles.admitSection}>
              <h4 className={styles.admitSectionTitle}>Student Details</h4>
              <div className={styles.admitGrid}>
                {userName && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Name</span>
                    <span className={styles.admitValue}>{userName}</span>
                  </div>
                )}
                {userPhone && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Phone</span>
                    <span className={styles.admitValue}>+91 {userPhone}</span>
                  </div>
                )}
                {userEmail && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Email</span>
                    <span className={styles.admitValue}>{userEmail}</span>
                  </div>
                )}
                {userStream && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>Stream</span>
                    <span className={styles.admitValue}>{userStream}</span>
                  </div>
                )}
                {userSchool && (
                  <div className={styles.admitField}>
                    <span className={styles.admitLabel}>School / College</span>
                    <span className={styles.admitValue}>{userSchool}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Download */}
        <div className={styles.pdfCard}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div>
            <p className={styles.pdfTitle}>Admit Card PDF</p>
            <p className={styles.pdfDesc}>Download your admit card for entry</p>
          </div>
          <button onClick={handleDownloadPdf} className={styles.downloadBtn}>
            Download
          </button>
        </div>

        <p className={styles.smsNote}>
          A confirmation SMS and email have been sent to your registered phone and email.
        </p>

        <div className={styles.actions}>
          <Link to="/profile">
            <Button>My Registrations</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">Back to Events</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
