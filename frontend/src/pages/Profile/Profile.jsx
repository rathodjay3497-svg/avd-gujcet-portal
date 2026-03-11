import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { useMyRegistrations } from '@/hooks/useRegistration';
import { useEvents } from '@/hooks/useEvent';
import EventBadge from '@/components/events/EventBadge/EventBadge';
import Loader from '@/components/ui/Loader/Loader';
import EmptyState from '@/components/ui/EmptyState/EmptyState';
import Button from '@/components/ui/Button/Button';
import ProfileForm from './ProfileForm';
import { formatDate } from '@/utils/formatters';
import styles from './Profile.module.css';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: registrations, isLoading } = useMyRegistrations();
  const { data: events } = useEvents();

  const getEventTitle = (eventId) => {
    const event = events?.find(e => e.event_id === eventId);
    return event?.title || eventId;
  };

  const isProfileIncomplete = !user?.name || !user?.phone || !user?.gender || !user?.stream || !user?.medium || !user?.address || !user?.school_college;
  const [isEditing, setIsEditing] = useState(isProfileIncomplete);

  useEffect(() => {
    if (location.state?.message) {
      toast(location.state.message, { icon: 'ℹ️' });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.message]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Phone missing banner */}
        {!user?.phone && !isEditing && (
          <div className={styles.phoneBanner}>
            <span>📱 Please add your mobile number to register for events.</span>
            <button className={styles.phoneBannerBtn} onClick={() => setIsEditing(true)}>
              Add now
            </button>
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.profileCard}>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'Profile'}
                  className={styles.avatarImg}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={styles.avatar}>
                  {(user?.name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className={styles.name}>{user?.name || 'Student'}</h3>
              <p className={styles.email}>{user?.email}</p>
              {user?.phone && (
                <p className={styles.phone}>+91 {user.phone}</p>
              )}
              {user?.stream && (
                <span className={styles.streamBadge}>{user.stream}</span>
              )}
              {!isEditing && (
                <div style={{ marginTop: '1.5rem' }}>
                  <Button fullWidth variant="secondary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.main}>
            {(isEditing || isProfileIncomplete) ? (
              <ProfileForm onCancel={() => setIsEditing(false)} />
            ) : null}

            <h2 className={styles.sectionTitle}>My Registrations</h2>

            {isLoading ? (
              <Loader text="Loading registrations..." />
            ) : registrations?.length > 0 ? (
              <div className={styles.regList}>
                {registrations.map((reg) => (
                  <div key={reg.registration_id} className={styles.regCard}>
                    <div className={styles.regInfo}>
                      <h4>{getEventTitle(reg.event_id)}</h4>
                      <p className={styles.regMeta}>
                        <span>Reg ID: <strong>{reg.registration_id}</strong></span>
                        <span>{formatDate(reg.registered_at)}</span>
                      </p>
                    </div>
                    <div className={styles.regActions}>
                      <EventBadge status={reg.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No registrations yet"
                message="You haven't registered for any events. Browse events and register!"
                action={
                  <Link to="/">
                    <Button>Browse Events</Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
