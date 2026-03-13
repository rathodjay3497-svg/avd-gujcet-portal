import { useNavigate } from 'react-router-dom';
import styles from './RegisterButton.module.css';

export default function RegisterButton({ event }) {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate(`/events/${event.event_id}/register`);
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

