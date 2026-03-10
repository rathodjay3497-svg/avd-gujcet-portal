import { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useAuthStore from '@/store/authStore';
import OtpInput from '@/components/forms/OtpInput/OtpInput';
import Button from '@/components/ui/Button/Button';
import styles from './Login.module.css';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { sendOTP, verifyOTP, loading } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If user was redirected here from a protected route, pass that path through
  const redirectTo = location.state?.from || undefined;

  // If already logged in, redirect away from login page
  if (isAuthenticated) {
    return <Navigate to={redirectTo || '/'} replace />;
  }

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const success = await sendOTP(phone);
    if (success) {
      setOtpSent(true);
      startCountdown();
    }
  };

  const handleVerifyOTP = async (otp) => {
    await verifyOTP(phone, otp, redirectTo);
  };

  const handleResend = async () => {
    const success = await sendOTP(phone);
    if (success) startCountdown();
  };

  const startCountdown = () => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoBox}>
          <span className={styles.logoIcon}>GC</span>
        </div>

        <h2 className={styles.title}>Student Login</h2>
        <p className={styles.subtitle}>Enter your phone number to receive a verification code</p>

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <label className={styles.label}>Phone Number</label>
            <div className={styles.phoneRow}>
              <span className={styles.prefix}>+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className={styles.phoneInput}
                maxLength={10}
              />
            </div>
            <Button type="submit" fullWidth loading={loading} disabled={phone.length !== 10} size="lg">
              Send OTP
            </Button>
          </form>
        ) : (
          <div className={styles.otpSection}>
            <p className={styles.otpHint}>
              Enter the 6-digit code sent to <strong>+91 {phone}</strong>
            </p>
            <OtpInput onComplete={handleVerifyOTP} />
            <div className={styles.resend}>
              {countdown > 0 ? (
                <span>Resend OTP in {countdown}s</span>
              ) : (
                <button onClick={handleResend} className={styles.resendBtn}>
                  Resend OTP
                </button>
              )}
            </div>
            <button onClick={() => setOtpSent(false)} className={styles.changePhone}>
              Change phone number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
