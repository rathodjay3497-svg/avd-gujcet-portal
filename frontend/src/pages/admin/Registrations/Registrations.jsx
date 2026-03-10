import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { adminAPI } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Registrations.module.css';

export default function Registrations() {
  const { id: eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getRegistrations(eventId)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleExport = async () => {
    try {
      const response = await adminAPI.exportCSV(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventId}-registrations.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const filteredRegs = data?.registrations?.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.registration_id?.toLowerCase().includes(s) ||
      r.phone?.includes(s) ||
      JSON.stringify(r.form_data).toLowerCase().includes(s)
    );
  }) || [];

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Registrations</h1>
            <p className={styles.subtitle}>{data?.event_title} &bull; {data?.total || 0} total</p>
          </div>
          <Button onClick={handleExport} variant="secondary">Export CSV</Button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className={styles.tableCard}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or registration ID..."
              className={styles.searchInput}
            />

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Reg ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Stream</th>
                    <th>Status</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((r) => (
                    <tr key={r.registration_id}>
                      <td><code>{r.registration_id}</code></td>
                      <td>{r.form_data?.name || '—'}</td>
                      <td>{r.phone}</td>
                      <td>{r.form_data?.stream || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[r.status]}`}>{r.status}</span>
                      </td>
                      <td>{formatDateTime(r.registered_at)}</td>
                    </tr>
                  ))}
                  {filteredRegs.length === 0 && (
                    <tr><td colSpan={6} className={styles.emptyRow}>No registrations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
