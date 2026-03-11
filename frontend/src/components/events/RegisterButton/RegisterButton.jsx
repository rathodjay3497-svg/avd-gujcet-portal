import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { useCheckRegistration, useRegister, useClickRegister } from '@/hooks/useRegistration';
import styles from './RegisterButton.module.css';

export default function RegisterButton({ event }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: checkData, isLoading: isCheckLoading } = useCheckRegistration(event?.event_id);
  const fullFormMutation = useRegister();
  const clickMutation = useClickRegister();

  const isClickToRegister = event?.registration_type === 'click_to_register';
  const registerMutation = isClickToRegister ? clickMutation : fullFormMutation;

  const isAlreadyRegistered = checkData?.registered;
  const isProfileIncomplete = !user?.name || !user?.stream || !user?.address || !user?.school_college || !user?.phone;

  const handleRegisterClick = async () => {
    if (isAlreadyRegistered) {
      navigate('/events/gujcet-2026');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${event.event_id}/register` }, replace: true });
      return;
    }

    if (isProfileIncomplete) {
      navigate('/profile', { state: { message: 'Please complete your profile details before registering for an event.', returnTo: `/events/${event.event_id}/register` }, replace: true });
      return;
    }
    
    // Auto-register logic
    try {
      if (isClickToRegister) {
        // Click-to-register: backend builds form_data from profile automatically
        await clickMutation.mutateAsync(event.event_id);
      } else {
        // Full form: pass profile data, then navigate to the form page
        navigate(`/events/${event.event_id}/register`);
        return;
      }
      navigate('/events/gujcet-2026');
    } catch (err) {
      // Error is handled in the mutation via toast
    }
  };

  if (isCheckLoading) {
    return (
      <button className={styles.registerBtn} disabled style={{ opacity: 0.7 }}>
        Checking...
      </button>
    );
  }

  return (
    <button 
      onClick={handleRegisterClick} 
      className={`${styles.registerBtn} ${isAlreadyRegistered ? styles.registered : ''}`}
      disabled={registerMutation.isPending}
    >
      {registerMutation.isPending ? 'Registering...' : isAlreadyRegistered ? 'Already Registered' : 'Register Now'}
    </button>
  );
}
