import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { hpclAPI } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from '../Registrations/Registrations.module.css';

const PAGE_SIZE = 10;

function useHPCLRegistrations() {
  return useQuery({
    queryKey: ['hpcl-registrations'],
    queryFn: async () => {
      const { data } = await hpclAPI.getAdminRegistrations();
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export default function HPCLRegistrations() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  const { data, isLoading, isFetching, dataUpdatedAt } = useHPCLRegistrations();

  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  useEffect(() => { setPage(1); }, [search]);

  const allRegs = data?.registrations ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allRegs;
    const s = search.toLowerCase();
    return allRegs.filter(r =>
      r.registration_id?.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s) ||
      r.phone?.includes(s) ||
      r.address?.toLowerCase().includes(s) ||
      r.standard?.toLowerCase().includes(s) ||
      r.playing_role?.toLowerCase().includes(s) ||
      r.group?.toLowerCase().includes(s) ||
      r.reference?.toLowerCase().includes(s) ||
      r.paid_to?.toLowerCase().includes(s)
    );
  }, [allRegs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportPDF = () => {
    if (!filtered.length) return toast.error('No data to export');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HPCL - Hari Prabodham Cricket League 2026', 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Registrations: ${filtered.length}  |  Exported: ${new Date().toLocaleString()}`, 40, 58);

    // Table headers and data
    const headers = [
      { id: 'no', name: 'no', prompt: '#', width: 28, align: 'center' },
      { id: 'registration_id', name: 'registration_id', prompt: 'Reg ID', width: 80 },
      { id: 'name', name: 'name', prompt: 'Name', width: 90 },
      { id: 'phone', name: 'phone', prompt: 'Phone', width: 72 },
      { id: 'age', name: 'age', prompt: 'Age', width: 30, align: 'center' },
      { id: 'address', name: 'address', prompt: 'Address', width: 100 },
      { id: 'standard', name: 'standard', prompt: 'Standard', width: 70 },
      { id: 'playing_role', name: 'playing_role', prompt: 'Role', width: 72 },
      { id: 'group', name: 'group', prompt: 'Group', width: 78 },
      { id: 'fees_paid', name: 'fees_paid', prompt: 'Fees Paid', width: 52, align: 'center' },
      { id: 'paid_to', name: 'paid_to', prompt: 'Paid To', width: 75 },
      { id: 'reference', name: 'reference', prompt: 'Reference', width: 70 },
      { id: 'registered_at', name: 'registered_at', prompt: 'Registered At', width: 100 },
    ];

    const rows = filtered.map((r, idx) => ({
      no: String(idx + 1),
      registration_id: r.registration_id || '—',
      name: r.name || '—',
      phone: r.phone || '—',
      age: String(r.age || '—'),
      address: r.address || '—',
      standard: r.standard || '—',
      playing_role: r.playing_role || '—',
      group: r.group || '—',
      fees_paid: r.fees_paid ? 'Yes' : 'No',
      paid_to: r.paid_to || '—',
      reference: r.reference || '—',
      registered_at: r.registered_at ? new Date(r.registered_at).toLocaleDateString('en-IN') : '—',
    }));

    doc.table(40, 72, rows, headers, {
      fontSize: 8,
      padding: 4,
      headerBackgroundColor: '#1A3C6E',
      headerColor: '#FFFFFF',
    });

    const filename = `HPCL-2026-registrations-${Date.now()}.pdf`;
    doc.save(filename);
    toast.success('PDF downloaded');
  };

  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

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
            <h1 className={styles.pageTitle}>HPCL Cricket League 2026</h1>
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
              onClick={handleExportPDF}
              variant="secondary"
              disabled={!filtered.length}
            >
              ↓ Export PDF
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
                  placeholder="Search by name, phone, city, group, standard…"
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
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Address</th>
                    <th>Standard</th>
                    <th>Playing Role</th>
                    <th>Batting</th>
                    <th>Bowling</th>
                    <th>Group</th>
                    <th>Fees Paid</th>
                    <th>Paid To</th>
                    <th>Reference</th>
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
                      <td>{r.phone || '—'}</td>
                      <td>{r.age || '—'}</td>
                      <td>{r.address || '—'}</td>
                      <td>{r.standard || '—'}</td>
                      <td>{r.playing_role || '—'}</td>
                      <td>{r.batting_style || '—'}</td>
                      <td>{r.bowling_style || '—'}</td>
                      <td>{r.group || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${r.fees_paid ? styles.confirmed : styles.waitlisted}`}>
                          {r.fees_paid ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{r.paid_to || '—'}</td>
                      <td>{r.reference || '—'}</td>
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
                      <td colSpan={16} className={styles.emptyRow}>
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
