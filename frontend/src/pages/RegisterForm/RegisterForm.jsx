import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvent';
import { useRegister, useCheckRegistration } from '@/hooks/useRegistration';
import useAuthStore from '@/store/authStore';
import DynamicForm from '@/components/forms/DynamicForm/DynamicForm';
import HtmlFormRenderer from '@/components/forms/HtmlFormRenderer/HtmlFormRenderer';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { data: event, isLoading: isEventLoading } = useEvent(eventId);
  const registerMutation = useRegister();
  const hasRedirected = useRef(false);

  const phone = user?.phone;
  const { data: checkData, isLoading: isCheckLoading } = useCheckRegistration(eventId);

  const isProfileIncomplete = !user?.name || !user?.stream || !user?.address || !user?.school_college;

  useEffect(() => {
    if (hasRedirected.current) return;
    if (!isAuthenticated) {
      hasRedirected.current = true;
      navigate('/login', { state: { from: location.pathname }, replace: true });
    } else if (isProfileIncomplete) {
      hasRedirected.current = true;
      navigate('/profile', { state: { message: 'Please complete your profile to register for events.' }, replace: true });
    }
  }, [isAuthenticated, isProfileIncomplete, navigate, location.pathname]);

  if (isEventLoading || isCheckLoading) return <Loader text="Loading..." />;
  if (!event) return <div className={styles.error}>Event not found</div>;
  if (!isAuthenticated || isProfileIncomplete) return null;

  if (checkData?.registered) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <h2 className={styles.title}>Already Registered</h2>
            <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
              You have already registered for this event.
            </p>
            <Link to="/profile">
              <Button>View My Registrations</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAutoRegistering = useRef(false);

  const handleFormSubmit = async (formData = {}) => {
    try {
      const result = await registerMutation.mutateAsync({
        eventId,
        phone,
        formData: {
          name: user.name,
          stream: user.stream,
          medium: user.medium,
          email: user.email,
          address: user.address,
          school_college: user.school_college,
          ...formData,
          phone
        },
      });

      navigate('/register/success', {
        state: {
          registrationId: result.registration_id,
          eventTitle: event.title,
          eventVenue: event.venue,
          eventDate: event.start_date,
          eventEndDate: event.end_date,
          eventFee: event.fee,
          organizedBy: event.organized_by,
          userName: user.name,
          userPhone: user.phone,
          userEmail: user.email,
          userStream: user.stream,
          userSchool: user.school_college,
          userAddress: user.address,
          userMedium: user.medium,
        },
      });
    } catch (err) {
      isAutoRegistering.current = false;
    }
  };

  useEffect(() => {
    // Auto-register gujcet-2026 if all conditions are met
    if (
      eventId === 'gujcet-2026' &&
      event &&
      isAuthenticated &&
      !isProfileIncomplete &&
      !checkData?.registered &&
      !isAutoRegistering.current
    ) {
      isAutoRegistering.current = true;
      handleFormSubmit({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, event, isAuthenticated, isProfileIncomplete, checkData]);

  if (eventId === 'gujcet-2026' && isAutoRegistering.current) {
    return <Loader text="Registering you automatically..." />;
  }

  // Determine if we should bypass the explicit form for this event
  const bypassForm = eventId === 'gujcet-2026';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Register for {event.title}</h2>
          <p className={styles.subtitle}>{event.venue} &bull; {event.start_date?.slice(0, 10)}</p>

          <div className={styles.phoneDisplay}>
            Registering as: <strong>{user?.name} (+91 {phone})</strong>
          </div>

          {!bypassForm && event.form_type === 'html' && event.form_html ? (
            <HtmlFormRenderer
              htmlString={event.form_html}
              onSubmit={handleFormSubmit}
            />
          ) : !bypassForm && event.form_schema ? (
            <DynamicForm
              schema={event.form_schema}
              onSubmit={handleFormSubmit}
              loading={registerMutation.isPending}
            />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
                Your profile details will be used for this registration.
              </p>
              <Button
                onClick={() => handleFormSubmit({})}
                loading={registerMutation.isPending}
                size="lg"
              >
                Confirm Registration
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
