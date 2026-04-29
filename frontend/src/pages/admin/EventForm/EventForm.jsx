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
    streams: 'Science,Commerce,Arts',
  });

  useEffect(() => {
    if (isEdit) {
      eventsAPI.get(id).then(({ data }) => {
        setForm({
          ...data,
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          start_time: data.start_time || '',
          end_time: data.end_time || '',
          registration_deadline: data.registration_deadline || '',
          contact_details: data.contact_details || '',
          whatsapp_link: data.whatsapp_link || '',
          streams: data.streams?.join(',') || '',
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
            <Field label="Start Date" name="start_date" type="datetime-local" value={form.start_date} onChange={handleChange} />
            <Field label="End Date (Optional)" name="end_date" type="datetime-local" value={form.end_date} onChange={handleChange} />
            <Field label="Start Time" name="start_time" type="time" value={form.start_time} onChange={handleChange} />
            <Field label="End Time (Optional)" name="end_time" type="time" value={form.end_time} onChange={handleChange} />
            <Field label="Registration Deadline" name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={handleChange} />
            <Field label="Fee" name="fee" type="number" value={form.fee} onChange={handleChange} />
            <Field label="Streams (comma-separated)" name="streams" value={form.streams} onChange={handleChange} />
            <Field label="Medium" name="medium" value={form.medium} onChange={handleChange} />
          </div>

          <Field label="Description" name="description" value={form.description} onChange={handleChange} textarea />
          <Field label="Contact Details (Optional)" name="contact_details" value={form.contact_details} onChange={handleChange} placeholder="e.g. John Doe - 9876543210" />
          <Field label="WhatsApp Group Link (Optional)" name="whatsapp_link" value={form.whatsapp_link} onChange={handleChange} placeholder="https://chat.whatsapp.com/..." />

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
