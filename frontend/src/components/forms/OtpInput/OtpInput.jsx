import { useRef, useState } from 'react';
import styles from './OtpInput.module.css';

export default function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (val && !/^\d$/.test(val)) return;

    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    // Auto-focus next
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const otp = newValues.join('');
    if (otp.length === length && !newValues.includes('')) {
      onComplete(otp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newValues = [...values];
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setValues(newValues);

    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className={styles.otpGroup}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={styles.otpBox}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
