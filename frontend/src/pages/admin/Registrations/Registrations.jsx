import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { useAdminRegistrations } from '@/hooks/useRegistration';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Registrations.module.css';

const PAGE_SIZE = 10;

export default function Registrations() {
  const { id: eventId } = useParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  const { data, isLoading, isFetching, dataUpdatedAt } = useAdminRegistrations(eventId);

  // Tick "updated X seconds ago" counter, reset on every successful fetch
  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  // Reset to page 1 whenever search changes
  useEffect(() => { setPage(1); }, [search]);

  const allRegs = data?.registrations ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allRegs;
    const s = search.toLowerCase();
    return allRegs.filter(r =>
      r.registration_id?.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.phone?.includes(s) ||
      r.stream?.toLowerCase().includes(s) ||
      r.school_college?.toLowerCase().includes(s) ||
      r.standard?.toLowerCase().includes(s) ||
      r.education_board?.toLowerCase().includes(s) ||
      r.interested_field?.toLowerCase().includes(s)
    );
  }, [allRegs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');

    const rows = filtered.map(r => ({
      'Registration ID': r.registration_id,
      'Name': r.name || '—',
      'Email': r.email || '—',
      'Phone': r.phone || '—',
      'Stream': r.stream || '—',
      'Standard': r.standard || '—',
      'Education Board': r.education_board || '—',
      'Interested Field': r.interested_field || '—',
      'School / College': r.school_college || '—',
      'Status': r.status,
      'Registered At': formatDateTime(r.registered_at),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

    const filename = `${data?.event_title || eventId}-registrations.xlsx`.replace(/\s+/g, '_');
    XLSX.writeFile(wb, filename);
    toast.success('Excel file downloaded');
  };

  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  // Build page number list with ellipsis
  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '…') {
        pages.push('…');
      }
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>

        {/* ─── Header ─── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{data?.event_title || 'Registrations'}</h1>
            <p className={styles.subtitle}>
              {data?.total ?? 0} total
              {filtered.length !== allRegs.length && ` · ${filtered.length} matching`}
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={`${styles.liveChip} ${isFetching ? styles.fetching : ''}`}>
              <span className={styles.dot} />
              {isFetching ? 'Refreshing…' : `Updated ${elapsed}s ago`}
            </div>
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              disabled={!filtered.length}
            >
              ↓ Export Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Loader text="Loading registrations…" />
        ) : (
          <div className={styles.tableCard}>

            {/* ─── Toolbar ─── */}
            <div className={styles.toolbar}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone, stream, school…"
                  className={styles.searchInput}
                />
                {search && (
                  <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
                )}
              </div>
              <span className={styles.resultCount}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ─── Table ─── */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thNum}>#</th>
                    <th>Reg ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Stream</th>
                    <th>Standard</th>
                    <th>Board</th>
                    <th>Interested Field</th>
                    <th>School / College</th>
                    <th>Status</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => (
                    <tr key={r.registration_id}>
                      <td className={styles.tdNum}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td><code>{r.registration_id}</code></td>
                      <td>{r.name || '—'}</td>
                      <td className={styles.emailCell} title={r.email}>{r.email || '—'}</td>
                      <td>{r.phone || '—'}</td>
                      <td>{r.stream || '—'}</td>
                      <td>{r.standard || '—'}</td>
                      <td>{r.education_board || '—'}</td>
                      <td>{r.interested_field || '—'}</td>
                      <td className={styles.schoolCell} title={r.school_college}>
                        {r.school_college || '—'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{formatDateTime(r.registered_at)}</td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={13} className={styles.emptyRow}>
                        {search
                          ? `No registrations match "${search}".`
                          : 'No registrations yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Prev
                </button>

                <div className={styles.pageNumbers}>
                  {pageNumbers.map((p, i) =>
                    p === '…' ? (
                      <span key={`e${i}`} className={styles.ellipsis}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next →
                </button>

                <span className={styles.pageInfo}>
                  Page {page} of {totalPages} · showing {paginated.length} of {filtered.length}
                </span>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
