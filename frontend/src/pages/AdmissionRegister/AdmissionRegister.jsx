import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicRegister } from '@/hooks/useRegistration';
import styles from './AdmissionRegister.module.css';

const STANDARDS = [
  '10th',
  '12th Sci - A group',
  '12th Sci - B group',
  '12th Commerce',
  '12th Arts',
];

const BOARDS = ['GSHSEB', 'CBSE', 'Other'];
const CASTES = ['General', 'EWS', 'OBC', 'SC', 'ST'];

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
    stream: '',
    standard: '',
    education_board: '',
    interested_field: '',
    medium: 'Gujarati',
    address: '',
    theory_percentile: '',
    gujcet_percentile: '',
    caste: 'General',
    notes: '',
    reference: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter valid 10-digit number';
    if (!form.school_college.trim()) e.school_college = 'Required';
    if (!form.standard) e.standard = 'Select standard';
    if (!form.education_board) e.education_board = 'Select board';
    if (!form.theory_percentile.trim()) e.theory_percentile = 'Required';
    if (!form.address.trim()) e.address = 'Required';
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
          stream: form.standard,
        },
      });

      navigate('/register/success', {
        state: {
          registrationId: result.registration_id,
          eventTitle: 'Admission Help Desk 2026',
          userName: form.name,
          userPhone: form.phone.trim(),
          userStandard: form.standard,
          userSchool: form.school_college,
          userMedium: form.medium,
          userGender: form.gender,
          whatsappLink: WHATSAPP_LINK,
        },
      });
    } catch { }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Admission Help Desk 2026</h2>
            <p className={styles.subtitle}>Get expert guidance for your future academic journey</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            
            {/* ─── Group 1: Personal Info ─── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Details</h3>
              <div className={styles.grid}>
                <div className={styles.col8}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                    <input
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                  </div>
                </div>
                <div className={styles.col4}>
                  <div className={styles.field}>
                    <label className={styles.label}>Gender <span className={styles.required}>*</span></label>
                    <div className={styles.radioGroup}>
                      {['Male', 'Female'].map(g => (
                        <label key={g} className={styles.radioLabel}>
                          <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={handleChange} />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Mobile (WhatsApp) <span className={styles.required}>*</span></label>
                    <div className={`${styles.phoneWrapper} ${errors.phone ? styles.inputError : ''}`}>
                      <span className={styles.phonePrefix}>+91</span>
                      <input
                        className={styles.phoneInput}
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="10-digit number" maxLength={10}
                      />
                    </div>
                    {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Medium <span className={styles.required}>*</span></label>
                    <div className={styles.radioGroup}>
                      {['Gujarati', 'English'].map(m => (
                        <label key={m} className={styles.radioLabel}>
                          <input type="radio" name="medium" value={m} checked={form.medium === m} onChange={handleChange} />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Caste / Category <span className={styles.required}>*</span></label>
                    <div className={styles.radioGroup}>
                      {CASTES.map(c => (
                        <label key={c} className={styles.radioLabel}>
                          <input type="radio" name="caste" value={c} checked={form.caste === c} onChange={handleChange} />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Group 2: Academic Info ─── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Academic Background</h3>
              <div className={styles.grid}>
                <div className={styles.col12}>
                  <div className={styles.field}>
                    <label className={styles.label}>School / College Name <span className={styles.required}>*</span></label>
                    <input
                      className={`${styles.input} ${errors.school_college ? styles.inputError : ''}`}
                      type="text" name="school_college" value={form.school_college} onChange={handleChange}
                      placeholder="Where are you currently studying?"
                    />
                    {errors.school_college && <span className={styles.errorMsg}>{errors.school_college}</span>}
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Standard <span className={styles.required}>*</span></label>
                    <select
                      className={`${styles.select} ${errors.standard ? styles.inputError : ''}`}
                      name="standard" value={form.standard} onChange={handleChange}
                    >
                      <option value="">Select Standard</option>
                      {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.standard && <span className={styles.errorMsg}>{errors.standard}</span>}
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Education Board <span className={styles.required}>*</span></label>
                    <select
                      className={`${styles.select} ${errors.education_board ? styles.inputError : ''}`}
                      name="education_board" value={form.education_board} onChange={handleChange}
                    >
                      <option value="">Select Board</option>
                      {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.education_board && <span className={styles.errorMsg}>{errors.education_board}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Group 3: Performance ─── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Performance Details</h3>
              <div className={styles.grid}>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Theory Percentile <span className={styles.required}>*</span></label>
                    <input
                      className={`${styles.input} ${errors.theory_percentile ? styles.inputError : ''}`}
                      type="text" name="theory_percentile" value={form.theory_percentile} onChange={handleChange}
                      placeholder="e.g. 95.50"
                    />
                    {errors.theory_percentile && <span className={styles.errorMsg}>{errors.theory_percentile}</span>}
                  </div>
                </div>
                {form.standard.includes('Sci') && (
                  <div className={styles.col6}>
                    <div className={styles.field}>
                      <label className={styles.label}>GUJCET Percentile</label>
                      <input
                        className={styles.input}
                        type="text" name="gujcet_percentile" value={form.gujcet_percentile} onChange={handleChange}
                        placeholder="e.g. 88.20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Group 4: Interest & Other ─── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Other Information</h3>
              <div className={styles.grid}>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Interested Field</label>
                    <input
                      className={styles.input}
                      type="text" name="interested_field" value={form.interested_field} onChange={handleChange}
                      placeholder="e.g. Engineering, Medical"
                    />
                  </div>
                </div>
                <div className={styles.col6}>
                  <div className={styles.field}>
                    <label className={styles.label}>Reference</label>
                    <input
                      className={styles.input}
                      type="text" name="reference" value={form.reference} onChange={handleChange}
                      placeholder="e.g. Friend, Teacher"
                    />
                  </div>
                </div>
                <div className={styles.col12}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Address <span className={styles.required}>*</span></label>
                    <textarea
                      className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                      name="address" value={form.address} onChange={handleChange}
                      placeholder="Enter your permanent address" rows={2}
                    />
                    {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
                  </div>
                </div>
                <div className={styles.col12}>
                  <div className={styles.field}>
                    <label className={styles.label}>Notes / Remark</label>
                    <textarea
                      className={styles.textarea}
                      name="notes" value={form.notes} onChange={handleChange}
                      placeholder="Any additional details you want to share..." rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Processing...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
