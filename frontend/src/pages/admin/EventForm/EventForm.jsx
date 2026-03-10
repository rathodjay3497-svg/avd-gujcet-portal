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
    registration_type: 'form',
    venue: '',
    start_date: '',
    end_date: '',
    fee: 0,
    registration_deadline: '',
    status: 'draft',
    form_type: 'json_schema',
    form_schema_text: '[\n  { "field_id": "name", "label": "Full Name", "type": "text", "required": true },\n  { "field_id": "phone", "label": "Phone Number", "type": "phone", "required": true },\n  { "field_id": "email", "label": "Email", "type": "email", "required": false },\n  { "field_id": "stream", "label": "Stream", "type": "select", "options": ["Science","Commerce","Arts"], "required": true },\n  { "field_id": "school", "label": "School / College", "type": "text", "required": true },\n  { "field_id": "district", "label": "District", "type": "text", "required": true }\n]',
    form_html: '',
    streams: 'Science,Commerce,Arts',
  });

  useEffect(() => {
    if (isEdit) {
      eventsAPI.get(id).then(({ data }) => {
        setForm({
          ...data,
          registration_deadline: data.registration_deadline || '',
          form_schema_text: data.form_schema ? JSON.stringify(data.form_schema, null, 2) : '',
          form_html: data.form_html || '',
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
    setLoading(true);

    try {
      const payload = {
        ...form,
        streams: form.streams.split(',').map((s) => s.trim()).filter(Boolean),
        fee: form.fee ? parseFloat(form.fee) : 0,
        form_schema: form.form_type === 'json_schema' && form.form_schema_text
          ? JSON.parse(form.form_schema_text)
          : null,
        form_html: form.form_type === 'html' ? form.form_html : null,
      };
      delete payload.form_schema_text;

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
            <Field label="Title" name="title" value={form.title} onChange={handleChange} placeholder="GUJCET Free Counseling 2026" />
            <Field label="Venue" name="venue" value={form.venue} onChange={handleChange} />
            <Field label="Start Date" name="start_date" type="datetime-local" value={form.start_date} onChange={handleChange} />
            <Field label="End Date (Optional)" name="end_date" type="datetime-local" value={form.end_date} onChange={handleChange} />
            <Field label="Registration Deadline" name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={handleChange} />
            <Field label="Fee" name="fee" type="number" value={form.fee} onChange={handleChange} />
            <Field label="Streams (comma-separated)" name="streams" value={form.streams} onChange={handleChange} />
            <Field label="Medium" name="medium" value={form.medium} onChange={handleChange} />
          </div>

          <Field label="Description" name="description" value={form.description} onChange={handleChange} textarea />

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Registration Type</label>
              <select name="registration_type" value={form.registration_type} onChange={handleChange} className={styles.input}>
                <option value="form">Full Form</option>
                <option value="click_to_register">Click to Register (Login Required)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={styles.input}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {form.registration_type === 'form' && (
            <>
              <div className={styles.field}>
                <label>Form Type</label>
                <select name="form_type" value={form.form_type} onChange={handleChange} className={styles.input}>
                  <option value="json_schema">JSON Schema (Form Builder)</option>
                  <option value="html">Raw HTML</option>
                </select>
              </div>

              {form.form_type === 'json_schema' ? (
                <div className={styles.field}>
                  <label>Form Schema (JSON)</label>
                  <textarea
                    name="form_schema_text"
                    value={form.form_schema_text}
                    onChange={handleChange}
                    className={styles.codeInput}
                    rows={12}
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className={styles.field}>
                  <label>Form HTML</label>
                  <textarea
                    name="form_html"
                    value={form.form_html}
                    onChange={handleChange}
                    className={styles.codeInput}
                    rows={12}
                    placeholder="<form>...</form>"
                    spellCheck={false}
                  />
                </div>
              )}
            </>
          )}

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
