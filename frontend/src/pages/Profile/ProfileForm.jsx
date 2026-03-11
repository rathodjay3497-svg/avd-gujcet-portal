import { useState } from 'react';
import { useUpdateProfile } from '@/hooks/useRegistration';
import Button from '@/components/ui/Button/Button';
import styles from './ProfileForm.module.css';
import useAuthStore from '@/store/authStore';

export default function ProfileForm({ onCancel }) {
    const { user } = useAuthStore();
    const updateMutation = useUpdateProfile();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        gender: user?.gender || 'Male',
        guardian_name: user?.guardian_name || '',
        guardian_phone: user?.guardian_phone || '',
        stream: user?.stream || '',
        medium: user?.medium || '',
        school_college: user?.school_college || '',
        address: user?.address || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateMutation.mutateAsync(formData);
        onCancel();
    };

    const isComplete = user?.name && user?.phone && user?.stream && user?.address && user?.school_college && user?.gender;

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Update Profile</h3>

            {/* ─── Google Account (read-only) ─── */}
            <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                <label>Email Address</label>
                <div className={styles.readonlyField}>
                    <span className={styles.readonlyIcon}>✉</span>
                    <span className={styles.readonlyValue}>{user?.email}</span>
                    <span className={styles.readonlyBadge}>Google</span>
                </div>
            </div>

            {/* ─── Section 1: Personal Identity ─── */}
            <div className={styles.section}>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label>Full Name <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mobile Number <span className={styles.required}>*</span></label>
                        <div className={styles.phoneRow}>
                            <span className={styles.prefix}>+91</span>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                required
                                className={styles.phoneInput}
                                placeholder="10-digit mobile number"
                                maxLength={10}
                                pattern="^\d{10}$"
                                title="Enter a 10-digit Indian mobile number"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Gender <span className={styles.required}>*</span></label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Male"
                                    checked={formData.gender === 'Male'}
                                    onChange={handleChange}
                                    required
                                /> Male
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Female"
                                    checked={formData.gender === 'Female'}
                                    onChange={handleChange}
                                    required
                                /> Female
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Section 2: Academic Profile ─── */}
            <div className={styles.section}>
                <div className={styles.grid}>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>School / College Name <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            name="school_college"
                            value={formData.school_college}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="Example High School"
                        />
                    </div>

                    <div className={styles.split6040}>
                        <div className={styles.formGroup}>
                            <label>Academic Stream <span className={styles.required}>*</span></label>
                            <select
                                name="stream"
                                value={formData.stream}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            >
                                <option value="">Select Stream</option>
                                <option value="12th Sci - A Group">12th Sci - A Group</option>
                                <option value="12th Sci - B Group">12th Sci - B Group</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Medium <span className={styles.required}>*</span></label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="medium"
                                        value="Gujarati"
                                        checked={formData.medium === 'Gujarati'}
                                        onChange={handleChange}
                                        required
                                    /> Gujarati
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="medium"
                                        value="English"
                                        checked={formData.medium === 'English'}
                                        onChange={handleChange}
                                        required
                                    /> English
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Section 3: Contact & Location ─── */}
            <div className={styles.section}>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label>Guardian Name</label>
                        <input
                            type="text"
                            name="guardian_name"
                            value={formData.guardian_name}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Parent / Guardian name"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Guardian Phone</label>
                        <div className={styles.phoneRow}>
                            <span className={styles.prefix}>+91</span>
                            <input
                                type="tel"
                                name="guardian_phone"
                                value={formData.guardian_phone}
                                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                className={styles.phoneInput}
                                placeholder="10-digit number"
                                maxLength={10}
                                pattern="^\d{10}$"
                                title="Enter a 10-digit Indian mobile number"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Address <span className={styles.required}>*</span></label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="Enter your full address"
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                {isComplete && onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={updateMutation.isPending}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={updateMutation.isPending}>
                    Save Profile
                </Button>
            </div>
        </form>
    );
}
