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
        email: user?.email || '',
        dob: user?.dob || '',
        gender: user?.gender || '',
        guardian_name: user?.guardian_name || '',
        guardian_phone: user?.guardian_phone || '',
        stream: user?.stream || '',
        medium: user?.medium || '',
        school_college: user?.school_college || '',
        address: user?.address || '',
        district: user?.district || '',
        state: user?.state || 'Gujarat',
        pin_code: user?.pin_code || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateMutation.mutateAsync(formData);
        onCancel();
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Update Profile</h3>
            <div className={styles.grid}>
                {/* ─── Personal Details ─── */}
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
                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="john@example.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Date of Birth <span className={styles.required}>*</span></label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Gender <span className={styles.required}>*</span></label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className={styles.input}
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                {/* ─── Guardian Details ─── */}
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
                    <input
                        type="tel"
                        name="guardian_phone"
                        value={formData.guardian_phone}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="10-digit number"
                        maxLength={10}
                    />
                </div>

                {/* ─── Academic Details ─── */}
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
                    <select
                        name="medium"
                        value={formData.medium}
                        onChange={handleChange}
                        required
                        className={styles.input}
                    >
                        <option value="">Select Medium</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="English">English</option>
                    </select>
                </div>

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

                {/* ─── Address Details ─── */}
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

                <div className={styles.formGroup}>
                    <label>District</label>
                    <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="e.g. Ahmedabad"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>State</label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Gujarat"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>PIN Code</label>
                    <input
                        type="text"
                        name="pin_code"
                        value={formData.pin_code}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="6-digit PIN"
                        maxLength={6}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                {user?.name && user?.stream && user?.address && user?.school_college && user?.dob && user?.gender && onCancel && (
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
