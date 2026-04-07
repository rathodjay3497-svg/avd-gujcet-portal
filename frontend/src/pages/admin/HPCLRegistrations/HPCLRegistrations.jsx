import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { hpclAPI } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from '../Registrations/Registrations.module.css';
import hpclStyles from './HPCLRegistrations.module.css';

const PAGE_SIZE = 10;

// ─── Data hook ───────────────────────────────────────────────────
function useHPCLRegistrations() {
  return useQuery({
    queryKey: ['hpcl-registrations'],
    queryFn: async () => {
      const { data } = await hpclAPI.getAdminRegistrations();
      return data;
    },
    // No refetchInterval — data is fetched once on mount.
    // Use the manual Refresh button in the UI to re-fetch.
    staleTime: Infinity,
  });
}

// ─── Dropdown filter component ───────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className={hpclStyles.filterDropdown} ref={ref}>
      <button
        className={`${hpclStyles.filterBtn} ${value.length ? hpclStyles.filterBtnActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        {label}
        {value.length > 0 && <span className={hpclStyles.filterCount}>{value.length}</span>}
        <span className={hpclStyles.filterArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={hpclStyles.dropdownMenu}>
          {options.length === 0 ? (
            <div className={hpclStyles.dropdownEmpty}>No options</div>
          ) : (
            options.map((opt) => (
              <label key={opt} className={hpclStyles.dropdownItem}>
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))
          )}
          {value.length > 0 && (
            <button
              className={hpclStyles.clearDropdown}
              onClick={() => onChange([])}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function HPCLRegistrations() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Active filter state — each is an array of selected values
  const [filterGroup, setFilterGroup] = useState([]);
  const [filterFeesPaid, setFilterFeesPaid] = useState([]);
  const [filterStandard, setFilterStandard] = useState([]);
  const [filterRole, setFilterRole] = useState([]);

  const { data, isLoading, isFetching } = useHPCLRegistrations();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hpcl-registrations'] });
  };

  // Reset to page 1 on any filter/search change
  useEffect(() => { setPage(1); }, [search, filterGroup, filterFeesPaid, filterStandard, filterRole]);

  const allRegs = data?.registrations ?? [];

  // ── Derive unique options from data ──────────────────────────
  const groupOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.group).filter(Boolean))].sort(), [allRegs]);

  const standardOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.standard).filter(Boolean))].sort(), [allRegs]);

  const roleOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.playing_role).filter(Boolean))].sort(), [allRegs]);

  const feesPaidOptions = ['Yes', 'No'];

  // ── Combined filter + search ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = allRegs;

    // Dropdown filters
    if (filterGroup.length) result = result.filter((r) => filterGroup.includes(r.group));
    if (filterFeesPaid.length) {
      result = result.filter((r) => {
        const val = r.fees_paid ? 'Yes' : 'No';
        return filterFeesPaid.includes(val);
      });
    }
    if (filterStandard.length) result = result.filter((r) => filterStandard.includes(r.standard));
    if (filterRole.length) result = result.filter((r) => filterRole.includes(r.playing_role));

    // Text search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
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
    }

    return result;
  }, [allRegs, search, filterGroup, filterFeesPaid, filterStandard, filterRole]);

  const hasFilters = filterGroup.length || filterFeesPaid.length || filterStandard.length || filterRole.length;

  const clearAllFilters = () => {
    setFilterGroup([]);
    setFilterFeesPaid([]);
    setFilterStandard([]);
    setFilterRole([]);
    setSearch('');
  };

  // Active filter chips for display
  const activeChips = [
    ...filterGroup.map((v) => ({ label: `Group: ${v}`, clear: () => setFilterGroup(filterGroup.filter((x) => x !== v)) })),
    ...filterFeesPaid.map((v) => ({ label: `Fees Paid: ${v}`, clear: () => setFilterFeesPaid(filterFeesPaid.filter((x) => x !== v)) })),
    ...filterStandard.map((v) => ({ label: `Standard: ${v}`, clear: () => setFilterStandard(filterStandard.filter((x) => x !== v)) })),
    ...filterRole.map((v) => ({ label: `Role: ${v}`, clear: () => setFilterRole(filterRole.filter((x) => x !== v)) })),
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Excel Export ──────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');

    const rows = filtered.map((r, idx) => ({
      '#': idx + 1,
      'Reg ID': r.registration_id || '—',
      'Name': r.name || '—',
      'Phone': r.phone || '—',
      'Age': r.age || '—',
      'Address': r.address || '—',
      'Standard': r.standard || '—',
      'Playing Role': r.playing_role || '—',
      'Batting Style': r.batting_style || '—',
      'Bowling Style': r.bowling_style || '—',
      'Group': r.group || '—',
      'Fees Paid': r.fees_paid ? 'Yes' : 'No',
      'Paid To': r.paid_to || '—',
      'Reference': r.reference || '—',
      'Status': r.status || '—',
      'Registered At': r.registered_at ? new Date(r.registered_at).toLocaleString('en-IN') : '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const cols = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
    }));
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HPCL Registrations');

    const filterSuffix = hasFilters ? '-filtered' : '';
    XLSX.writeFile(wb, `HPCL-2026-registrations${filterSuffix}-${Date.now()}.xlsx`);
    toast.success(`Excel downloaded — ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`);
  };

  // ── PDF Export ────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!filtered.length) return toast.error('No data to export');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HPCL - Hari Prabodham Cricket League 2026', 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Registrations: ${filtered.length}  |  Exported: ${new Date().toLocaleString()}`, 40, 58);

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

    const filterSuffix = hasFilters ? '-filtered' : '';
    doc.save(`HPCL-2026-registrations${filterSuffix}-${Date.now()}.pdf`);
    toast.success(`PDF downloaded — ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`);
  };

  // ── Pagination helpers ─────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────
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
            <Button
              onClick={handleRefresh}
              variant="secondary"
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing…' : '↺ Refresh'}
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              disabled={!filtered.length}
            >
              ↓ Export Excel
            </Button>
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

            {/* ─── Toolbar: search + filters ─── */}
            <div className={hpclStyles.toolbarRow}>
              {/* Search */}
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

              {/* Dropdown filters */}
              <div className={hpclStyles.filtersRow}>
                <FilterDropdown
                  label="Group"
                  options={groupOptions}
                  value={filterGroup}
                  onChange={setFilterGroup}
                />
                <FilterDropdown
                  label="Fees Paid"
                  options={feesPaidOptions}
                  value={filterFeesPaid}
                  onChange={setFilterFeesPaid}
                />
                <FilterDropdown
                  label="Standard"
                  options={standardOptions}
                  value={filterStandard}
                  onChange={setFilterStandard}
                />
                <FilterDropdown
                  label="Playing Role"
                  options={roleOptions}
                  value={filterRole}
                  onChange={setFilterRole}
                />
                {(hasFilters || search) && (
                  <button className={hpclStyles.clearAllBtn} onClick={clearAllFilters} type="button">
                    Clear All
                  </button>
                )}
              </div>

              <span className={styles.resultCount}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ─── Active filter chips ─── */}
            {activeChips.length > 0 && (
              <div className={hpclStyles.chipRow}>
                {activeChips.map((chip, i) => (
                  <span key={i} className={hpclStyles.chip}>
                    {chip.label}
                    <button
                      className={hpclStyles.chipRemove}
                      onClick={chip.clear}
                      type="button"
                      aria-label={`Remove ${chip.label}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

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
                        {search || hasFilters
                          ? 'No registrations match the current filters.'
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
