import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Button from '@/components/ui/Button/Button';
import { eventsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import styles from './EventForm.module.css';

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    event_id: '',
    title: '',
    description: '',
    medium: 'English',
    event_type: 'counseling',
    venue: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    fee: 0,
    registration_deadline: '',
    status: 'draft',
    contact_details: '',
    whatsapp_link: '',
    image_url: '',
    show_countdown: false,
    streams: 'Science,Commerce,Arts',
  });

  useEffect(() => {
    if (isEdit) {
      eventsAPI.get(id).then(({ data }) => {
        setForm({
          ...data,
          start_date: data.start_date?.slice(0, 10) || '',
          end_date: data.end_date?.slice(0, 10) || '',
          start_time: data.start_time || '',
          end_time: data.end_time || '',
          registration_deadline: data.registration_deadline || '',
          contact_details: data.contact_details || '',
          whatsapp_link: data.whatsapp_link || '',
          image_url: data.image_url || '',
          show_countdown: data.show_countdown || false,
          streams: data.streams?.join(',') || '',
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state for compression if needed, but it's usually fast
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions for banner
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Start with 0.7 quality
        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still too large (approx 400KB limit for DynamoDB, but let's be safe), 
        // reduce quality further
        while (dataUrl.length > 400000 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setForm({ ...form, image_url: dataUrl });
        if (dataUrl.length > 400000) {
          toast.error('Image is still too large after compression. Please use a smaller file.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm({ ...form, image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.event_id.trim() || !form.title.trim()) {
      toast.error('Event ID and Title are required fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        streams: form.streams.split(',').map((s) => s.trim()).filter(Boolean),
        fee: form.fee ? parseFloat(form.fee) : 0,
      };

      if (isEdit) {
        await eventsAPI.update(id, payload);
        toast.success('Event updated');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event created');
      }
      navigate('/admin/events');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <h1>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <Field label="Event ID (slug)" name="event_id" value={form.event_id} onChange={handleChange} disabled={isEdit} placeholder="e.g. gujcet-2026" />
            <Field label="Title" name="title" value={form.title} onChange={handleChange} placeholder="Admission Help Desk 2026" />
            <Field label="Venue" name="venue" value={form.venue} onChange={handleChange} />
            <Field label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
            <Field label="End Date (Optional)" name="end_date" type="date" value={form.end_date} onChange={handleChange} />
            <Field label="Start Time" name="start_time" type="time" value={form.start_time} onChange={handleChange} />
            <Field label="End Time (Optional)" name="end_time" type="time" value={form.end_time} onChange={handleChange} />
            <Field label="Fee" name="fee" type="number" value={form.fee} onChange={handleChange} />
            <div className={styles.field}>
              <label>Registration Deadline</label>
              <div className={styles.deadlineWrapper}>
                <input 
                  type="datetime-local" 
                  name="registration_deadline" 
                  value={form.registration_deadline} 
                  onChange={handleChange} 
                  className={styles.input} 
                />
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    name="show_countdown" 
                    checked={form.show_countdown} 
                    onChange={handleChange} 
                  />
                  Show Countdown Timer
                </label>
              </div>
            </div>
            <Field label="Streams (comma-separated)" name="streams" value={form.streams} onChange={handleChange} />
            <Field label="Medium" name="medium" value={form.medium} onChange={handleChange} />
          </div>

          <Field label="Description" name="description" value={form.description} onChange={handleChange} textarea />
          <Field label="Contact Details (Optional)" name="contact_details" value={form.contact_details} onChange={handleChange} placeholder="e.g. John Doe - 9876543210" />
          <Field label="WhatsApp Group Link (Optional)" name="whatsapp_link" value={form.whatsapp_link} onChange={handleChange} placeholder="https://chat.whatsapp.com/..." />
          
          <div className={styles.imageUpload}>
            <label className={styles.label}>Event Banner Image (Optional)</label>
            {!form.image_url ? (
              <div className={styles.uploadArea} onClick={() => document.getElementById('imageInput').click()}>
                <div className={styles.uploadPlaceholder}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span>Click to upload image</span>
                  <span className={styles.hint}>Auto-compressed (Supports 2-5MB)</span>
                </div>
                <input 
                  id="imageInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className={styles.previewContainer}>
                <img src={form.image_url} alt="Preview" className={styles.previewImage} />
                <button type="button" className={styles.removeBtn} onClick={removeImage} title="Remove image">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={styles.input}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" loading={loading} size="lg">
              {isEdit ? 'Update Event' : 'Create Event'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/events')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder, disabled, textarea }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange} className={styles.input} rows={4} placeholder={placeholder} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} className={styles.input} placeholder={placeholder} disabled={disabled} />
      )}
    </div>
  );
}
