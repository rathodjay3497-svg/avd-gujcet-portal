import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicRegister } from '@/hooks/useRegistration';
import styles from '../RegisterForm/RegisterForm.module.css';

const STANDARDS = [
  '10th',
  '12th Sci - A group',
  '12th Sci - B group',
  '12th Commerce',
  '12th Arts',
];

const BOARDS = ['GSHSEB', 'CBSE', 'Other'];

const ADMISSION_EVENT_ID = 'admission-2026';
const WHATSAPP_LINK = 'https://chat.whatsapp.com/G7FuTO8iHn80ouTCkhkKUo?mode=hqctswa';

export default function AdmissionRegister() {
  const navigate = useNavigate();
  const registerMutation = usePublicRegister();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    school_college: '',
    stream: '',          // kept for backend compat – mapped from standard
    standard: '',
    education_board: '',
    interested_field: '',
    medium: 'Gujarati',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.gender) e.gender = 'Please select gender';
    if (!form.school_college.trim()) e.school_college = 'School / College name is required';
    if (!form.standard) e.standard = 'Please select your standard';
    if (!form.education_board) e.education_board = 'Please select education board';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        eventId: ADMISSION_EVENT_ID,
        formData: {
          ...form,
          phone: form.phone.trim(),
          stream: form.standard,  // map standard → stream for backend
        },
      });

      navigate('/register/success', {
        state: {
          registrationId: result.registration_id,
          eventTitle: 'Admission Help Desk 2026',
          userName: form.name,
          userPhone: form.phone.trim(),
          userStream: form.standard,
          userSchool: form.school_college,
          userMedium: form.medium,
          userGender: form.gender,
          whatsappLink: WHATSAPP_LINK,
        },
      });
    } catch {
      // Error toast is shown by the hook
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Register for Admission Help Desk</h2>
          <p className={styles.subtitle}>Fill in your details to get expert admission guidance</p>

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

            {/* ── Gender ── */}
            <div className={styles.field}>
              <label className={styles.label}>Gender <span className={styles.required}>*</span></label>
              <div className={styles.radioGroup}>
                {['Male', 'Female'].map(g => (
                  <label key={g} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={handleChange}
                    />
                    {g}
                  </label>
                ))}
              </div>
              {errors.gender && <span className={styles.errorMsg}>{errors.gender}</span>}
            </div>

            {/* ── School / College ── */}
            <div className={styles.field}>
              <label className={styles.label}>School / College Name <span className={styles.required}>*</span></label>
              <input
                className={`${styles.input} ${errors.school_college ? styles.inputError : ''}`}
                type="text"
                name="school_college"
                value={form.school_college}
                onChange={handleChange}
                placeholder="Example High School"
              />
              {errors.school_college && <span className={styles.errorMsg}>{errors.school_college}</span>}
            </div>

            {/* ── Row 2: Standard + Education Board ── */}
            <div className={styles.row}>
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

              <div className={styles.field}>
                <label className={styles.label}>Education Board <span className={styles.required}>*</span></label>
                <select
                  className={`${styles.select} ${errors.education_board ? styles.inputError : ''}`}
                  name="education_board"
                  value={form.education_board}
                  onChange={handleChange}
                >
                  <option value="">Select Board</option>
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.education_board && <span className={styles.errorMsg}>{errors.education_board}</span>}
              </div>
            </div>

            {/* ── Medium ── */}
            <div className={styles.field}>
              <label className={styles.label}>Medium <span className={styles.required}>*</span></label>
              <div className={styles.radioGroup}>
                {['Gujarati', 'English'].map(m => (
                  <label key={m} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="medium"
                      value={m}
                      checked={form.medium === m}
                      onChange={handleChange}
                    />
                    {m}
                  </label>
                ))}
              </div>
              {errors.medium && <span className={styles.errorMsg}>{errors.medium}</span>}
            </div>

            {/* ── Interested Field ── */}
            <div className={styles.field}>
              <label className={styles.label}>Interested Field (in which you want to join)</label>
              <input
                className={styles.input}
                type="text"
                name="interested_field"
                value={form.interested_field}
                onChange={handleChange}
                placeholder="e.g. Engineering, Medical, Commerce, etc."
              />
            </div>

            {/* ── Address ── */}
            <div className={styles.field}>
              <label className={styles.label}>Full Address <span className={styles.required}>*</span></label>
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

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Submitting…' : 'Submit Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
