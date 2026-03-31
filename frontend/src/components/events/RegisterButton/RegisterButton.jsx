import { useNavigate } from 'react-router-dom';
import styles from './RegisterButton.module.css';

export default function RegisterButton({ event }) {
  const navigate = useNavigate();

  const isAdmission = event.event_id === 'admission-2026';

  const handleRegisterClick = () => {
    if (isAdmission) {
      navigate('/admission-2026/register');
    } else {
      navigate(`/events/${event.event_id}/register`);
    }
  };

  return (
    <button
      onClick={handleRegisterClick}
      className={styles.registerBtn}
    >
      Register Now
    </button>
  );
}

