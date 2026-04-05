import { useState, useEffect } from 'react';
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
  'Dastav',
  'Sarlata',
  'Swikar',
  'Ekta',
  'Mogri',
];

const HPCL_WHATSAPP_LINK = 'https://chat.whatsapp.com/HPCLCricket2026DummyLink';
const REGISTRATION_FEE = 350;

export default function HPCLCricket() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Register for HPCL Cricket League 2026</h2>
          <p className={styles.subtitle}>HPCL - Hari Prabodham Cricket League 2026 — Fill in your details to register</p>

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
                <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Firstname Lastname"
                />
                {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Mobile Number (WhatsApp) <span className={styles.required}>*</span></label>
                <div className={`${styles.phoneWrapper} ${errors.phone ? styles.inputError : ''}`}>
                  <span className={styles.phonePrefix}>+91</span>
                  <input
                    className={styles.phoneInput}
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

            {/* ── Age ── */}
            <div className={styles.field}>
              <label className={styles.label}>Age <span className={styles.required}>*</span></label>
              <input
                className={`${styles.input} ${errors.age ? styles.inputError : ''}`}
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

            {/* ── Address ── */}
            <div className={styles.field}>
              <label className={styles.label}>Address <span className={styles.required}>*</span></label>
              <textarea
                className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your full address"
                rows={3}
              />
              {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
            </div>

            {/* ── Standard ── */}
            <div className={styles.field}>
              <label className={styles.label}>Standard <span className={styles.required}>*</span></label>
              <select
                className={`${styles.select} ${errors.standard ? styles.inputError : ''}`}
                name="standard"
                value={form.standard}
                onChange={handleChange}
              >
                <option value="">Select Standard</option>
                {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.standard && <span className={styles.errorMsg}>{errors.standard}</span>}
            </div>

            {/* ── Playing Role ── */}
            <div className={styles.field}>
              <label className={styles.label}>Playing Role <span className={styles.required}>*</span></label>
              <select
                className={`${styles.select} ${errors.playing_role ? styles.inputError : ''}`}
                name="playing_role"
                value={form.playing_role}
                onChange={handleChange}
              >
                <option value="">Select Playing Role</option>
                {PLAYING_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.playing_role && <span className={styles.errorMsg}>{errors.playing_role}</span>}
            </div>

            {/* ── Row 3: Batting + Bowling Style ── */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Batting Style</label>
                <select
                  className={styles.select}
                  name="batting_style"
                  value={form.batting_style}
                  onChange={handleChange}
                >
                  <option value="">Select Batting Style</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Bowling Style</label>
                <select
                  className={styles.select}
                  name="bowling_style"
                  value={form.bowling_style}
                  onChange={handleChange}
                >
                  <option value="">Select Bowling Style</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* ── Group ── */}
            <div className={styles.field}>
              <label className={styles.label}>Group <span className={styles.required}>*</span></label>
              <select
                className={`${styles.select} ${errors.group ? styles.inputError : ''}`}
                name="group"
                value={form.group}
                onChange={handleChange}
              >
                <option value="">Select Group</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.group && <span className={styles.errorMsg}>{errors.group}</span>}
            </div>

            {/* ── Reference (optional) ── */}
            <div className={styles.field}>
              <label className={styles.label}>Reference <span className={localStyles.optional}>(optional)</span></label>
              <input
                className={styles.input}
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
                  <label className={styles.label}>Paid To (Whom) <span className={styles.required}>*</span></label>
                  <input
                    className={`${styles.input} ${errors.paid_to ? styles.inputError : ''}`}
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
              className={styles.submitBtn}
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
