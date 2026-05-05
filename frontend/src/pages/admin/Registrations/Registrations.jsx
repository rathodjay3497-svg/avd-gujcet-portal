import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import { useAdminRegistrations, useUpdateAdminRegistration, useDeleteAdminRegistration } from '@/hooks/useRegistration';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Registrations.module.css';

const PAGE_SIZE = 10;

export default function Registrations() {
  const { id: eventId } = useParams();
  const [search, setSearch] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [filterCaste, setFilterCaste] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editingReg, setEditingReg] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useAdminRegistrations(eventId);
  const updateMutation = useUpdateAdminRegistration(eventId, () => setEditingReg(null));
  const deleteMutation = useDeleteAdminRegistration(eventId);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-registrations', eventId] });
  };

  useEffect(() => { setPage(1); }, [search, filterStandard, filterMedium, filterCaste, filterStatus]);

  const allRegs = data?.registrations ?? [];

  // Extract unique standards and mediums for filters
  const standards = useMemo(() => [...new Set(allRegs.map(r => r.standard).filter(Boolean))].sort(), [allRegs]);
  const mediums = useMemo(() => [...new Set(allRegs.map(r => r.medium).filter(Boolean))].sort(), [allRegs]);
  const castes = useMemo(() => [...new Set(allRegs.map(r => r.caste).filter(Boolean))].sort(), [allRegs]);

  const filtered = useMemo(() => {
    return allRegs.filter(r => {
      const s = search.toLowerCase();
      const matchesSearch = !search.trim() || (
        r.registration_id?.toLowerCase().includes(s) ||
        r.name?.toLowerCase().includes(s) ||
        r.phone?.includes(s) ||
        r.school_college?.toLowerCase().includes(s) ||
        r.address?.toLowerCase().includes(s) ||
        r.reference?.toLowerCase().includes(s) ||
        r.education_board?.toLowerCase().includes(s) ||
        r.interested_field?.toLowerCase().includes(s) ||
        r.notes?.toLowerCase().includes(s)
      );
      const matchesStandard = !filterStandard || r.standard === filterStandard;
      const matchesMedium = !filterMedium || r.medium === filterMedium;
      const matchesCaste = !filterCaste || r.caste === filterCaste;
      const matchesStatus = !filterStatus || r.status === filterStatus;
      return matchesSearch && matchesStandard && matchesMedium && matchesCaste && matchesStatus;
    });
  }, [allRegs, search, filterStandard, filterMedium, filterCaste, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');

    const rows = filtered.map(r => ({
      'Registration ID': r.registration_id,
      'Name': r.name || '—',
      'Phone': r.phone || '—',
      'Gender': r.gender || '—',
      'Standard / Education': r.standard || '—',
      'Education Board': r.education_board || '—',
      'School / College': r.school_college || '—',
      'Medium': r.medium || '—',
      'Caste': r.caste || '—',
      'Interested Field': r.interested_field || '—',
      'Address': r.address || '—',
      'Theory %': r.theory_percentile || '—',
      'GUJCET %': r.gujcet_percentile || '—',
      'Reference': r.reference || '—',
      'Notes': r.notes || '—',
      'Status': r.status,
      'Registered At': formatDateTime(r.registered_at),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
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

  const handleDelete = (email, name) => {
    if (window.confirm(`Are you sure you want to delete registration for ${name}?`)) {
      deleteMutation.mutate(email);
    }
  };

  const handleEdit = (reg) => {
    setEditingReg({ ...reg });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      email: editingReg.email,
      data: {
        name: editingReg.name,
        phone: editingReg.phone,
        gender: editingReg.gender,
        standard: editingReg.standard,
        school_college: editingReg.school_college,
        education_board: editingReg.education_board,
        medium: editingReg.medium,
        caste: editingReg.caste,
        interested_field: editingReg.interested_field,
        address: editingReg.address,
        theory_percentile: editingReg.theory_percentile,
        gujcet_percentile: editingReg.gujcet_percentile,
        notes: editingReg.notes,
        reference: editingReg.reference,
        status: editingReg.status,
      }
    });
  };

  const goToPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{data?.event_title || 'Registrations'}</h1>
            <p className={styles.subtitle}>
              {data?.total ?? 0} total
              {filtered.length !== allRegs.length && ` · ${filtered.length} matching`}
            </p>
          </div>

          <div className={styles.headerActions}>
            <Button onClick={handleRefresh} variant="secondary" disabled={isFetching}>
              {isFetching ? 'Refreshing…' : '↺ Refresh'}
            </Button>
            <Button onClick={handleExportExcel} variant="secondary" disabled={!filtered.length}>
              ↓ Export Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Loader text="Loading registrations…" />
        ) : (
          <div className={styles.tableCard}>

            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, school, notes..."
                    className={styles.searchInput}
                  />
                </div>
                
                <select 
                  className={styles.selectFilter}
                  value={filterStandard} 
                  onChange={e => setFilterStandard(e.target.value)}
                >
                  <option value="">All Standards</option>
                  {standards.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select 
                  className={styles.selectFilter}
                  value={filterMedium} 
                  onChange={e => setFilterMedium(e.target.value)}
                >
                  <option value="">All Mediums</option>
                  {mediums.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                <select 
                  className={styles.selectFilter}
                  value={filterCaste} 
                  onChange={e => setFilterCaste(e.target.value)}
                >
                  <option value="">All Castes</option>
                  {castes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                  className={styles.selectFilter}
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <span className={styles.resultCount}>
                {filtered.length} results
              </span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name / Phone / Gender</th>
                    <th>Standard / Board / Medium / Caste</th>
                    <th>School / Interest</th>
                    <th>Theory % / GUJCET %</th>
                    <th>Address</th>
                    <th>Ref</th>
                    <th>Notes</th>
                    <th>Registered At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => (
                    <tr key={r.registration_id}>
                      <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className={styles.nameCell}>
                          <strong>{r.name}</strong>
                          <span>{r.phone}</span>
                          <small className={styles.genderTag}>{r.gender}</small>
                        </div>
                      </td>
                      <td>
                        <div className={styles.metaCell}>
                          <span>{r.standard}</span>
                          <strong>{r.education_board}</strong>
                          <small>{r.medium} · {r.caste}</small>
                        </div>
                      </td>
                      <td>
                        <div className={styles.schoolCell}>
                          <span>{r.school_college}</span>
                          {r.interested_field && <em className={styles.interestTag}>Target: {r.interested_field}</em>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.percentileCell}>
                          <span>T: {r.theory_percentile || '—'}</span>
                          <span>G: {r.gujcet_percentile || '—'}</span>
                        </div>
                      </td>
                      <td className={styles.longCell}>{r.address}</td>
                      <td><span className={styles.refText}>{r.reference || '—'}</span></td>
                      <td className={styles.longCell}>{r.notes || '—'}</td>
                      <td>
                        <div className={styles.dateCell}>
                          {formatDateTime(r.registered_at)}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button onClick={() => handleEdit(r)} className={styles.editBtn}>Edit</button>
                          <button onClick={() => handleDelete(r.email, r.name)} className={styles.deleteBtn}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                 <button onClick={() => goToPage(page - 1)} disabled={page === 1}>← Prev</button>
                 <span>Page {page} of {totalPages}</span>
                 <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={!!editingReg} 
        onClose={() => setEditingReg(null)} 
        title="Edit Registration"
      >
        {editingReg && (
          <form onSubmit={handleUpdateSubmit} className={styles.editForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  value={editingReg.name} 
                  onChange={e => setEditingReg({...editingReg, name: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input 
                  type="text" 
                  value={editingReg.phone} 
                  onChange={e => setEditingReg({...editingReg, phone: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Registration ID</label>
                <input type="text" value={editingReg.registration_id} readOnly className={styles.readOnlyInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Registered At</label>
                <input type="text" value={formatDateTime(editingReg.registered_at)} readOnly className={styles.readOnlyInput} />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Gender</label>
                <select 
                  value={editingReg.gender} 
                  onChange={e => setEditingReg({...editingReg, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Medium</label>
                <select 
                  value={editingReg.medium} 
                  onChange={e => setEditingReg({...editingReg, medium: e.target.value})}
                >
                  <option value="Gujarati">Gujarati</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Caste</label>
                <select 
                  value={editingReg.caste} 
                  onChange={e => setEditingReg({...editingReg, caste: e.target.value})}
                >
                  <option value="General">General</option>
                  <option value="EWS">EWS</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Standard</label>
                <input 
                  type="text" 
                  value={editingReg.standard} 
                  onChange={e => setEditingReg({...editingReg, standard: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Education Board</label>
                <input 
                  type="text" 
                  value={editingReg.education_board} 
                  onChange={e => setEditingReg({...editingReg, education_board: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>School / College</label>
                <input 
                  type="text" 
                  value={editingReg.school_college} 
                  onChange={e => setEditingReg({...editingReg, school_college: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Interested Field</label>
                <input 
                  type="text" 
                  value={editingReg.interested_field} 
                  onChange={e => setEditingReg({...editingReg, interested_field: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Theory Percentile</label>
                <input 
                  type="text" 
                  value={editingReg.theory_percentile} 
                  onChange={e => setEditingReg({...editingReg, theory_percentile: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>GUJCET Percentile</label>
                <input 
                  type="text" 
                  value={editingReg.gujcet_percentile} 
                  onChange={e => setEditingReg({...editingReg, gujcet_percentile: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Reference</label>
              <input 
                type="text" 
                value={editingReg.reference} 
                onChange={e => setEditingReg({...editingReg, reference: e.target.value})} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Notes / Remark</label>
              <textarea 
                value={editingReg.notes} 
                onChange={e => setEditingReg({...editingReg, notes: e.target.value})} 
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Address</label>
              <textarea 
                value={editingReg.address} 
                onChange={e => setEditingReg({...editingReg, address: e.target.value})} 
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select 
                value={editingReg.status} 
                onChange={e => setEditingReg({...editingReg, status: e.target.value})}
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setEditingReg(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
