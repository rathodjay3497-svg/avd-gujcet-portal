import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hpclAPI } from '@/services/api';
import toast from 'react-hot-toast';
import styles from '../RegisterForm/RegisterForm.module.css';
import localStyles from './HPCLCricket.module.css';

const STANDARDS = ['10th', '11th Sci', '11th Commerce', '12th Sci', '12th Commerce'];
const PLAYING_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const BATTING_STYLES = ['Right Hand', 'Left Hand'];
const BOWLING_STYLES = [
  'Right Arm Fast',
  'Right Arm Medium',
  'Right Arm Spin',
  'Left Arm Fast',
  'Left Arm Medium',
  'Left Arm Spin',
  'Not Applicable',
];
const GROUPS = [
  'Suhradbhav',
  'Bhoolku',
  'Samp',
  'Atmiya',
  'Dasatva',
  'Saradta',
  'Swikar',
  'Ekta',
  'Mogri',
];

const HPCL_WHATSAPP_LINK = 'https://chat.whatsapp.com/DYAFkq1upt51xXS2J4evg1';
const REGISTRATION_FEE = 350;

const TARGET_DATE = new Date('2026-05-09T00:00:00+05:30');

function getTimeLeft() {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function HPCLCricket() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(timerRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    address: '',
    standard: '',
    playing_role: '',
    batting_style: '',
    bowling_style: '',
    group: '',
    reference: '',
    fees_paid: false,
    paid_to: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.age || isNaN(form.age) || Number(form.age) < 5 || Number(form.age) > 80)
      e.age = 'Enter a valid age (5–80)';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.standard) e.standard = 'Please select your standard';
    if (!form.playing_role) e.playing_role = 'Please select your playing role';
    if (!form.group) e.group = 'Please select your group';
    if (form.fees_paid && !form.paid_to.trim()) e.paid_to = 'Please enter who you paid to';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => ({
      ...prev,
      [name]: newValue,
      // clear paid_to when unchecking fees_paid
      ...(name === 'fees_paid' && !checked ? { paid_to: '' } : {}),
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await hpclAPI.register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        age: Number(form.age),
        address: form.address.trim(),
        standard: form.standard,
        playing_role: form.playing_role,
        batting_style: form.batting_style || null,
        bowling_style: form.bowling_style || null,
        group: form.group,
        reference: form.reference.trim() || null,
        fees_paid: form.fees_paid,
        paid_to: form.fees_paid ? form.paid_to.trim() : null,
      });

      navigate('/hpcl-2026/success', {
        state: {
          registrationId: result.data.registration_id,
          userName: form.name.trim(),
          userPhone: form.phone.trim(),
          userGroup: form.group,
          whatsappLink: HPCL_WHATSAPP_LINK,
        },
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`).join('\n'), { duration: 5000 });
      } else {
        toast.error(detail || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={localStyles.page}>
      {/* ── Submitting GIF overlay ── */}
      {isSubmitting && (
        <div className={localStyles.gifOverlay}>
          <div className={localStyles.gifBox}>
            <img
              src="/assets/hpcl/catch.gif"
              alt="Submitting…"
              className={localStyles.catchGif}
            />
            <p className={localStyles.gifLabel}>Submitting your registration…</p>
          </div>
        </div>
      )}

      <div className={`${styles.container} ${localStyles.hpclContainer}`}>
        <div className={`${styles.card} ${localStyles.hpclCard}`}>
          <div className={localStyles.headerRow}>
            <h2 className={`${styles.title} ${localStyles.hpclTitle}`}>Register for HPCL 2026</h2>
            <span className={localStyles.typeBadge}>
              <span className={localStyles.liveDot} />
              <span className={localStyles.liveText}>LIVE</span>
              Box Cricket
            </span>
          </div>
          <p className={`${styles.subtitle} ${localStyles.hpclSubtitle}`}>HPCL - Hari Prabodham Cricket League 2026 - Fill in your details to register</p>

          {/* ── Countdown Timer ── */}
          {timeLeft ? (
            <div className={localStyles.countdownWrapper}>
              <p className={localStyles.countdownLabel}>⏳ Registration closes on <strong>9 May 2026</strong></p>
              <div className={localStyles.countdownRow}>
                {[['Days', timeLeft.days], ['Hours', timeLeft.hours], ['Minutes', timeLeft.minutes], ['Seconds', timeLeft.seconds]].map(
                  ([unit, val]) => (
                    <div key={unit} className={localStyles.countdownUnit}>
                      <span className={localStyles.countdownNum}>{String(val).padStart(2, '0')}</span>
                      <span className={localStyles.countdownUnitLabel}>{unit}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className={localStyles.closedBanner}>
              <span className={localStyles.closedIcon}>🏏</span>
              <div>
                <p className={localStyles.closedTitle}>Registration Closed</p>
                <p className={localStyles.closedDesc}>The registration window for HPCL 2026 has ended on 9 May 2026. Thank you for your interest!</p>
              </div>
            </div>
          )}

          {/* ── Fee Notice ── */}
          <div className={localStyles.feeNotice}>
            <span className={localStyles.feeIcon}>₹</span>
            <div>
              <p className={localStyles.feeTitle}>Registration Fee: ₹{REGISTRATION_FEE}</p>
              <p className={localStyles.feeDesc}>Please pay the registration fee and mark it as paid below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Row 1: Name + Phone ── */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Full Name <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.input} ${localStyles.hpclInput} ${errors.name ? styles.inputError : ''}`}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Firstname Lastname"
                />
                {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Mobile Number (WhatsApp) <span className={styles.required}>*</span></label>
                <div className={`${styles.phoneWrapper} ${localStyles.hpclPhoneWrapper} ${errors.phone ? styles.inputError : ''}`}>
                  <span className={`${styles.phonePrefix} ${localStyles.hpclPhonePrefix}`}>+91</span>
                  <input
                    className={`${styles.phoneInput} ${localStyles.hpclInput}`}
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Age <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.input} ${localStyles.hpclInput} ${errors.age ? styles.inputError : ''}`}
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 17"
                  min={5}
                  max={80}
                />
                {errors.age && <span className={styles.errorMsg}>{errors.age}</span>}
              </div>

              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Standard <span className={styles.required}>*</span></label>
                <select
                  className={`${styles.select} ${localStyles.hpclSelect} ${errors.standard ? styles.inputError : ''}`}
                  name="standard"
                  value={form.standard}
                  onChange={handleChange}
                >
                  <option value="">Select Standard</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.standard && <span className={styles.errorMsg}>{errors.standard}</span>}
              </div>
            </div>

            {/* ── Playing Role + Group ── */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Playing Role <span className={styles.required}>*</span></label>
                <select
                  className={`${styles.select} ${localStyles.hpclSelect} ${errors.playing_role ? styles.inputError : ''}`}
                  name="playing_role"
                  value={form.playing_role}
                  onChange={handleChange}
                >
                  <option value="">Select Playing Role</option>
                  {PLAYING_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.playing_role && <span className={styles.errorMsg}>{errors.playing_role}</span>}
              </div>

              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Group <span className={styles.required}>*</span></label>
                <select
                  className={`${styles.select} ${localStyles.hpclSelect} ${errors.group ? styles.inputError : ''}`}
                  name="group"
                  value={form.group}
                  onChange={handleChange}
                >
                  <option value="">Select Group</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.group && <span className={styles.errorMsg}>{errors.group}</span>}
              </div>
            </div>

            {/* ── Row 3: Batting + Bowling Style ── */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Batting Style</label>
                <select
                  className={`${styles.select} ${localStyles.hpclSelect}`}
                  name="batting_style"
                  value={form.batting_style}
                  onChange={handleChange}
                >
                  <option value="">Select Batting Style</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={`${styles.label} ${localStyles.hpclLabel}`}>Bowling Style</label>
                <select
                  className={`${styles.select} ${localStyles.hpclSelect}`}
                  name="bowling_style"
                  value={form.bowling_style}
                  onChange={handleChange}
                >
                  <option value="">Select Bowling Style</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* ── Address ── */}
            <div className={styles.field}>
              <label className={`${styles.label} ${localStyles.hpclLabel}`}>Address <span className={styles.required}>*</span></label>
              <textarea
                className={`${styles.textarea} ${localStyles.hpclTextarea} ${errors.address ? styles.inputError : ''}`}
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your full address"
                rows={2}
              />
              {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
            </div>

            {/* ── Reference (optional) ── */}
            <div className={styles.field}>
              <label className={`${styles.label} ${localStyles.hpclLabel}`}>Reference <span className={localStyles.optional}>(optional)</span></label>
              <input
                className={`${styles.input} ${localStyles.hpclInput}`}
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                placeholder="Name of person who referred you"
              />
            </div>

            {/* ── Fees Paid ── */}
            <div className={localStyles.feesPaidSection}>
              <label className={localStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="fees_paid"
                  checked={form.fees_paid}
                  onChange={handleChange}
                  className={localStyles.checkbox}
                />
                <span>Fees Paid (₹{REGISTRATION_FEE})</span>
              </label>

              {form.fees_paid && (
                <div className={`${styles.field} ${localStyles.paidToField}`}>
                  <label className={`${styles.label} ${localStyles.hpclLabel}`}>Paid To (Whom) <span className={styles.required}>*</span></label>
                  <input
                    className={`${styles.input} ${localStyles.hpclInput} ${errors.paid_to ? styles.inputError : ''}`}
                    type="text"
                    name="paid_to"
                    value={form.paid_to}
                    onChange={handleChange}
                    placeholder="Enter the name of person you paid to"
                  />
                  {errors.paid_to && <span className={styles.errorMsg}>{errors.paid_to}</span>}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${localStyles.hpclSubmitBtn}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
