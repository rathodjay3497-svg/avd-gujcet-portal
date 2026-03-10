import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Button from '@/components/ui/Button/Button';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';
import styles from './Notify.module.css';

export default function Notify() {
  const { eventId } = useParams();
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('sms');
  const [filterStream, setFilterStream] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setLoading(true);
    try {
      const { data } = await adminAPI.sendNotifications(eventId, {
        message,
        channel,
        filter_stream: filterStream || null,
      });
      toast.success(`Sent ${data.sms_sent} SMS, ${data.email_sent} emails`);
      setMessage('');
    } catch {
      toast.error('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <h1>Send Notifications</h1>
        <p className={styles.eventId}>Event: {eventId}</p>

        <div className={styles.card}>
          <div className={styles.field}>
            <label>Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={styles.input}>
              <option value="sms">SMS Only</option>
              <option value="email">Email Only</option>
              <option value="both">SMS + Email</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Filter by Stream (optional)</label>
            <select value={filterStream} onChange={(e) => setFilterStream(e.target.value)} className={styles.input}>
              <option value="">All Students</option>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.input}
              rows={6}
              placeholder="Type your notification message..."
            />
          </div>

          <Button onClick={handleSend} loading={loading} size="lg">
            Send Notification
          </Button>
        </div>
      </div>
    </div>
  );
}
