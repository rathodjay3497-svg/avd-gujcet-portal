import { useState, useEffect, useRef } from 'react';
import styles from './CountdownTimer.module.css';

export default function CountdownTimer({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const t = calculateTimeLeft(targetDate);
      setTimeLeft(t);
      if (!t) clearInterval(timerRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className={styles.closedBanner}>
        <span className={styles.closedIcon}>⏳</span>
        <div>
          <p className={styles.closedTitle}>Registration Closed</p>
          <p className={styles.closedDesc}>The registration window for this event has ended.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.countdownWrapper}>
      <p className={styles.countdownLabel}>{label || '⏳ Registration closes in:'}</p>
      <div className={styles.countdownRow}>
        {[
          ['Days', timeLeft.days],
          ['Hours', timeLeft.hours],
          ['Minutes', timeLeft.minutes],
          ['Seconds', timeLeft.seconds]
        ].map(([unit, val]) => (
          <div key={unit} className={styles.countdownUnit}>
            <span className={styles.countdownNum}>{String(val).padStart(2, '0')}</span>
            <span className={styles.countdownUnitLabel}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateTimeLeft(targetDateStr) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  const diff = target - Date.now();
  if (diff <= 0) return null;
  
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
