import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import { hpclAPI } from '@/services/api';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from '../Registrations/Registrations.module.css';
import hpclStyles from './HPCLRegistrations.module.css';

const PAGE_SIZE = 10;

const STANDARDS = ['10th', '11th Sci', '11th Commerce', '12th Sci', '12th Commerce'];
const PLAYING_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const BATTING_STYLES = ['Right Hand', 'Left Hand'];
const BOWLING_STYLES = [
  'Right Arm Fast',
  'Right Arm Medium',
  'Right Arm Spin',
  'Left Arm Fast',
  'Left Arm Medium',
  'Left Arm Spin',
  'Not Applicable',
];
const GROUPS = [
  'Suhradbhav',
  'Bhoolku',
  'Samp',
  'Atmiya',
  'Dasatva',
  'Saradta',
  'Swikar',
  'Ekta',
  'Mogri',
];
const STATUSES = ['registered', 'confirmed', 'pending', 'cancelled'];

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

// ─── Delete Confirmation Modal ────────────────────────────────────
function DeleteConfirmModal({ reg, onConfirm, onCancel, isPending }) {
  if (!reg) return null;
  return (
    <div className={hpclStyles.modalOverlay} onClick={onCancel}>
      <div className={hpclStyles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={hpclStyles.modalIcon}>🗑️</div>
        <h3 className={hpclStyles.modalTitle}>Delete Registration?</h3>
        <p className={hpclStyles.modalMessage}>
          Do you want to delete <strong>{reg.name}</strong>,{' '}
          <strong>{reg.phone}</strong>?
        </p>
        <p className={hpclStyles.modalWarning}>This action cannot be undone.</p>
        <div className={hpclStyles.modalActions}>
          <button
            className={hpclStyles.modalCancelBtn}
            onClick={onCancel}
            disabled={isPending}
            type="button"
          >
            Cancel
          </button>
          <button
            className={hpclStyles.modalDeleteBtn}
            onClick={onConfirm}
            disabled={isPending}
            type="button"
          >
            {isPending ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
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
  const [filterStatus, setFilterStatus] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Edit/Delete states
  const [editingReg, setEditingReg] = useState(null);
  const [deleteReg, setDeleteReg] = useState(null);

  const { data, isLoading, isFetching, dataUpdatedAt } = useHPCLRegistrations();

  const updateMutation = useMutation({
    mutationFn: ({ phone, updates }) => hpclAPI.updateRegistration(phone, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hpcl-registrations'] });
      toast.success('Registration updated');
      setEditingReg(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (phone) => hpclAPI.deleteRegistration(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hpcl-registrations'] });
      toast.success('Registration deleted successfully');
      setDeleteReg(null);
      setEditingReg(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  });

  const handleStartEdit = (r) => {
    setEditingReg({ ...r });
  };

  const handleCancelEdit = () => {
    setEditingReg(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const phone = editingReg.phone;
    if (editingReg.fees_paid && !editingReg.paid_to?.trim()) {
      return toast.error('Please provide "Paid To" name');
    }
    updateMutation.mutate({ phone, updates: editingReg });
  };

  const handleDeleteClick = (r) => {
    setDeleteReg(r);
  };

  const handleDeleteConfirm = () => {
    if (deleteReg) {
      deleteMutation.mutate(deleteReg.phone);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteReg(null);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hpcl-registrations'] });
  };

  // Reset to page 1 on any filter/search change
  useEffect(() => { setPage(1); }, [search, filterGroup, filterFeesPaid, filterStandard, filterRole, filterStatus]);

  const allRegs = data?.registrations ?? [];

  // ── Derive unique options from data ──────────────────────────
  const groupOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.group).filter(Boolean))].sort(), [allRegs]);

  const standardOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.standard).filter(Boolean))].sort(), [allRegs]);

  const roleOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.playing_role).filter(Boolean))].sort(), [allRegs]);

  const statusOptions = useMemo(() =>
    [...new Set(allRegs.map((r) => r.status).filter(Boolean))].sort(), [allRegs]);

  const feesPaidOptions = ['Yes', 'No'];

  // ── Combined filter + search + SORT by registered_at desc ────
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
    if (filterStatus.length) result = result.filter((r) => filterStatus.includes(r.status));

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

    // Sort by registered_at
    result = [...result].sort((a, b) => {
      const dateA = a.registered_at ? new Date(a.registered_at).getTime() : 0;
      const dateB = b.registered_at ? new Date(b.registered_at).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [allRegs, search, filterGroup, filterFeesPaid, filterStandard, filterRole, filterStatus, sortOrder]);

  const hasFilters = filterGroup.length || filterFeesPaid.length || filterStandard.length || filterRole.length || filterStatus.length;

  const clearAllFilters = () => {
    setFilterGroup([]);
    setFilterFeesPaid([]);
    setFilterStandard([]);
    setFilterRole([]);
    setFilterStatus([]);
    setSearch('');
  };

  // Active filter chips for display
  const activeChips = [
    ...filterGroup.map((v) => ({ label: `Group: ${v}`, clear: () => setFilterGroup(filterGroup.filter((x) => x !== v)) })),
    ...filterFeesPaid.map((v) => ({ label: `Fees Paid: ${v}`, clear: () => setFilterFeesPaid(filterFeesPaid.filter((x) => x !== v)) })),
    ...filterStandard.map((v) => ({ label: `Standard: ${v}`, clear: () => setFilterStandard(filterStandard.filter((x) => x !== v)) })),
    ...filterRole.map((v) => ({ label: `Role: ${v}`, clear: () => setFilterRole(filterRole.filter((x) => x !== v)) })),
    ...filterStatus.map((v) => ({ label: `Status: ${v}`, clear: () => setFilterStatus(filterStatus.filter((x) => x !== v)) })),
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
      'Remark': r.notes || '—',
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
      { id: 'notes', name: 'notes', prompt: 'Remark', width: 70 },
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
      notes: r.notes || '—',
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
                <FilterDropdown
                  label="Status"
                  options={statusOptions}
                  value={filterStatus}
                  onChange={setFilterStatus}
                />
                {(hasFilters || search) && (
                  <button className={hpclStyles.clearAllBtn} onClick={clearAllFilters} type="button">
                    Clear All
                  </button>
                )}
              </div>

              <div className={hpclStyles.sortWrapper}>
                <span className={hpclStyles.sortLabel}>Sort By:</span>
                <select 
                  className={hpclStyles.sortSelect}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newer First</option>
                  <option value="oldest">Older First</option>
                </select>
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
                    {/* Desktop-only columns */}
                    <th className={hpclStyles.hideOnMobile}>Reg ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th className={hpclStyles.hideOnMobile}>Age</th>
                    <th className={hpclStyles.hideOnMobile}>Address</th>
                    <th className={hpclStyles.hideOnMobile}>Standard</th>
                    <th className={hpclStyles.hideOnMobile}>Playing Role</th>
                    <th className={hpclStyles.hideOnMobile}>Batting</th>
                    <th className={hpclStyles.hideOnMobile}>Bowling</th>
                    <th className={hpclStyles.hideOnMobile}>Group</th>
                    <th>Fees Paid</th>
                    <th className={hpclStyles.hideOnMobile}>Paid To</th>
                    <th className={hpclStyles.hideOnMobile}>Reference</th>
                    <th className={hpclStyles.hideOnMobile}>Remark</th>
                    <th className={hpclStyles.hideOnMobile}>Status</th>
                    <th className={hpclStyles.hideOnMobile}>Registered At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => {
                    return (
                      <tr key={r.registration_id}>
                        <td className={styles.tdNum}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        {/* Desktop-only cells */}
                        <td className={hpclStyles.hideOnMobile}><code>{r.registration_id}</code></td>
                        <td>
                          {r.name || '—'}
                        </td>
                        <td>{r.phone || '—'}</td>
                        <td className={hpclStyles.hideOnMobile}>{r.age || '—'}</td>
                        <td
                          className={`${hpclStyles.hideOnMobile} ${hpclStyles.addressCell}`}
                          title={r.address || ''}
                        >
                          {r.address || '—'}
                        </td>
                        <td className={hpclStyles.hideOnMobile}>{r.standard || '—'}</td>
                        <td className={hpclStyles.hideOnMobile}>{r.playing_role || '—'}</td>
                        <td className={hpclStyles.hideOnMobile}>{r.batting_style || '—'}</td>
                        <td className={hpclStyles.hideOnMobile}>{r.bowling_style || '—'}</td>
                        <td className={hpclStyles.hideOnMobile}>{r.group || '—'}</td>
                        <td>
                          <span className={`${styles.badge} ${r.fees_paid ? styles.confirmed : styles.waitlisted}`}>
                            {r.fees_paid ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className={hpclStyles.hideOnMobile}>
                          {r.paid_to || '—'}
                        </td>
                        <td className={hpclStyles.hideOnMobile}>
                          <span className={styles.refText}>{r.reference || '—'}</span>
                        </td>
                        <td className={hpclStyles.hideOnMobile}>
                          <span className={styles.refText}>{r.notes || '—'}</span>
                        </td>
                        <td className={hpclStyles.hideOnMobile}>
                          <span className={`${styles.badge} ${styles[r.status]}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className={`${styles.dateCell} ${hpclStyles.hideOnMobile}`}>{formatDateTime(r.registered_at)}</td>
                        <td>
                          <div className={hpclStyles.actions}>
                            <button
                              className={hpclStyles.editBtn}
                              onClick={() => handleStartEdit(r)}
                            >
                              Edit
                            </button>
                            <button
                              className={hpclStyles.deleteBtn}
                              onClick={() => handleDeleteClick(r)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={17} className={styles.emptyRow}>
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

      {/* ─── Delete Confirmation Modal ─── */}
      <DeleteConfirmModal
        reg={deleteReg}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isPending={deleteMutation.isPending}
      />

      {/* ─── Edit Modal ─── */}
      <Modal
        isOpen={!!editingReg}
        onClose={handleCancelEdit}
        title="Edit HPCL Registration"
      >
        {editingReg && (
          <form onSubmit={handleSaveEdit} className={hpclStyles.editForm}>
            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={editingReg.name || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, name: e.target.value })}
                  required
                />
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  value={editingReg.phone || ''}
                  readOnly
                  className={hpclStyles.readOnlyInput}
                />
              </div>
            </div>

            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Registration ID</label>
                <input
                  type="text"
                  value={editingReg.registration_id || ''}
                  readOnly
                  className={hpclStyles.readOnlyInput}
                />
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Registered At</label>
                <input
                  type="text"
                  value={editingReg.registered_at ? new Date(editingReg.registered_at).toLocaleString() : ''}
                  readOnly
                  className={hpclStyles.readOnlyInput}
                />
              </div>
            </div>

            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Age</label>
                <input
                  type="number"
                  value={editingReg.age || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, age: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Standard</label>
                <select
                  value={editingReg.standard || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, standard: e.target.value })}
                >
                  <option value="">Select Standard</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Playing Role</label>
                <select
                  value={editingReg.playing_role || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, playing_role: e.target.value })}
                >
                  <option value="">Select Role</option>
                  {PLAYING_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Group</label>
                <select
                  value={editingReg.group || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, group: e.target.value })}
                >
                  <option value="">Select Group</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Batting Style</label>
                <select
                  value={editingReg.batting_style || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, batting_style: e.target.value })}
                >
                  <option value="">Select Batting Style</option>
                  {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Bowling Style</label>
                <select
                  value={editingReg.bowling_style || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, bowling_style: e.target.value })}
                >
                  <option value="">Select Bowling Style</option>
                  {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className={hpclStyles.formRow}>
              <div className={hpclStyles.formGroup}>
                <label>Fees Paid</label>
                <select
                  value={editingReg.fees_paid ? 'Yes' : 'No'}
                  onChange={(e) => {
                    const val = e.target.value === 'Yes';
                    setEditingReg({
                      ...editingReg,
                      fees_paid: val,
                      paid_to: val ? editingReg.paid_to : ''
                    });
                  }}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className={hpclStyles.formGroup}>
                <label>Paid To</label>
                <input
                  type="text"
                  value={editingReg.paid_to || ''}
                  onChange={(e) => setEditingReg({ ...editingReg, paid_to: e.target.value })}
                  disabled={!editingReg.fees_paid}
                  placeholder={editingReg.fees_paid ? "Name of person..." : "N/A"}
                />
              </div>
            </div>

            <div className={hpclStyles.formGroup}>
              <label>Status</label>
              <select
                value={editingReg.status || 'registered'}
                onChange={(e) => setEditingReg({ ...editingReg, status: e.target.value })}
              >
                <option value="registered">Registered</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={hpclStyles.formGroup}>
              <label>Reference</label>
              <input
                type="text"
                value={editingReg.reference || ''}
                onChange={(e) => setEditingReg({ ...editingReg, reference: e.target.value })}
              />
            </div>

            <div className={hpclStyles.formGroup}>
              <label>Remark (Notes)</label>
              <textarea
                value={editingReg.notes || ''}
                onChange={(e) => setEditingReg({ ...editingReg, notes: e.target.value })}
                rows={2}
                placeholder="Internal notes or remarks..."
              />
            </div>

            <div className={hpclStyles.formGroup}>
              <label>Address</label>
              <textarea
                value={editingReg.address || ''}
                onChange={(e) => setEditingReg({ ...editingReg, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className={hpclStyles.modalActions}>
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
