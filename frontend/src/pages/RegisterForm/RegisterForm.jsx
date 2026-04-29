import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvent';
import { usePublicRegister } from '@/hooks/useRegistration';
import Loader from '@/components/ui/Loader/Loader';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading: isEventLoading } = useEvent(eventId);
  const registerMutation = usePublicRegister();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    standard: '',
    school_college: '',
    medium: 'English',
    address: '',
    reference: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (isEventLoading) return <Loader text="Loading event…" />;
  if (!event) return <div className={styles.error}>Event not found</div>;

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.gender) e.gender = 'Please select gender';
    if (!form.standard.trim()) e.standard = 'Standard / Education is required';
    if (!form.school_college.trim()) e.school_college = 'School / College name is required';
    if (!form.medium) e.medium = 'Please select medium';
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
        eventId,
        formData: { ...form, phone: form.phone.trim() },
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
          whatsappLink: event.whatsapp_link,
          userName: form.name,
          userPhone: form.phone.trim(),
          userStandard: form.standard,
          userSchool: form.school_college,
          userMedium: form.medium,
          userGender: form.gender,
          userReference: form.reference,
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
          <div className={styles.header}>
            <h2 className={styles.title}>Registration Form</h2>
            <p className={styles.eventLabel}>{event.title}</p>
            {event.venue && event.start_date && (
              <p className={styles.subtitle}>{event.venue} &bull; {event.start_date?.slice(0, 10)}</p>
            )}
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

            {/* ── Row 2: Gender + Medium ── */}
            <div className={styles.row}>
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
            </div>

            {/* ── Standard ── */}
            <div className={styles.field}>
              <label className={styles.label}>Standard / Education <span className={styles.required}>*</span></label>
              <input
                className={`${styles.input} ${errors.standard ? styles.inputError : ''}`}
                type="text"
                name="standard"
                value={form.standard}
                onChange={handleChange}
                placeholder="e.g. 12th Science, Engineering Student, etc."
              />
              {errors.standard && <span className={styles.errorMsg}>{errors.standard}</span>}
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
                placeholder="Enter your school or college name"
              />
              {errors.school_college && <span className={styles.errorMsg}>{errors.school_college}</span>}
            </div>

            {/* ── Address ── */}
            <div className={styles.field}>
              <label className={styles.label}>Full Address <span className={styles.required}>*</span></label>
              <textarea
                className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your full home address"
                rows={2}
              />
              {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
            </div>

            {/* ── Reference ── */}
            <div className={styles.field}>
              <label className={styles.label}>Reference (Optional)</label>
              <input
                className={styles.input}
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                placeholder="How did you hear about us? (Friend, Social Media, etc.)"
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Submitting…' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
