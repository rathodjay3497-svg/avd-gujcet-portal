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

const STANDARDS_LIST = [
  '10th',
  '12th Sci - A group',
  '12th Sci - B group',
  '12th Commerce',
  '12th Arts',
  'Graduation',
];

const BOARDS_LIST = ['GSHSEB', 'CBSE', 'Other'];

export default function Registrations() {
  const { id: eventId } = useParams();

  // Determine which view to render
  const isAdmission = eventId === 'admission-2026';

  const [search, setSearch] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [filterCaste, setFilterCaste] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [editingReg, setEditingReg] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useAdminRegistrations(eventId);
  const updateMutation = useUpdateAdminRegistration(eventId, () => setEditingReg(null));
  const deleteMutation = useDeleteAdminRegistration(eventId);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-registrations', eventId] });
  };

  useEffect(() => { setPage(1); }, [search, filterStandard, filterMedium, filterCaste, filterStatus, sortOrder]);

  const allRegs = data?.registrations ?? [];

  // Extract unique values for filters
  const standards = useMemo(() => [...new Set(allRegs.map(r => r.standard).filter(Boolean))].sort(), [allRegs]);
  const mediums   = useMemo(() => [...new Set(allRegs.map(r => r.medium).filter(Boolean))].sort(), [allRegs]);
  const castes    = useMemo(() => [...new Set(allRegs.map(r => r.caste).filter(Boolean))].sort(), [allRegs]);

  const filtered = useMemo(() => {
    const filteredRegs = allRegs.filter(r => {
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
      const matchesMedium   = !filterMedium   || r.medium === filterMedium;
      const matchesCaste    = !filterCaste    || r.caste === filterCaste;
      const matchesStatus   = !filterStatus   || r.status === filterStatus;
      return matchesSearch && matchesStandard && matchesMedium && matchesCaste && matchesStatus;
    });

    return [...filteredRegs].sort((a, b) => {
      const dateA = new Date(a.registered_at || 0);
      const dateB = new Date(b.registered_at || 0);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [allRegs, search, filterStandard, filterMedium, filterCaste, filterStatus, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Export Excel ──────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');

    const rows = isAdmission
      ? filtered.map(r => ({
          'Registration ID':       r.registration_id,
          'Name':                  r.name || '—',
          'Phone':                 r.phone || '—',
          'Gender':                r.gender || '—',
          'Standard / Stream':  r.standard === 'Graduation' ? (r.graduation_degree ? `Graduation - ${r.graduation_degree}` : 'Graduation') : (r.standard || '—'),
          'Education Board':       r.education_board || '—',
          'School / College':      r.school_college || '—',
          'Medium':                r.medium || '—',
          'Caste':                 r.caste || '—',
          'Interested Field':      r.interested_field || '—',
          'Address':               r.address || '—',
          'Theory % / CGPA':       r.theory_percentile || '—',
          'GUJCET %':              r.gujcet_percentile || '—',
          'Rank':                  r.rank || 0,
          'Reference':             r.reference || '—',
          'Notes':                 r.notes || '—',
          'Status':                r.status,
          'Registered At':         formatDateTime(r.registered_at),
        }))
      : filtered.map(r => ({
          'Registration ID':       r.registration_id,
          'Name':                  r.name || '—',
          'Phone':                 r.phone || '—',
          'Gender':                r.gender || '—',
          'Standard / Stream':  r.standard || '—',
          'School / College':      r.school_college || '—',
          'Medium':                r.medium || '—',
          'Full Address':          r.address || '—',
          'Reference':             r.reference || '—',
          'Notes':                 r.notes || '—',
          'Status':                r.status,
          'Registered At':         formatDateTime(r.registered_at),
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
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const commonFields = {
      name:          editingReg.name,
      phone:         editingReg.phone,
      gender:        editingReg.gender,
      standard:      editingReg.standard,
      school_college: editingReg.school_college,
      medium:        editingReg.medium,
      address:       editingReg.address,
      reference:     editingReg.reference,
      notes:         editingReg.notes,
      status:        editingReg.status,
    };

    const admissionExtra = isAdmission ? {
      graduation_degree: editingReg.graduation_degree,
      education_board:   editingReg.education_board,
      caste:             editingReg.caste,
      interested_field:  editingReg.interested_field,
      theory_percentile: editingReg.theory_percentile,
      gujcet_percentile: editingReg.gujcet_percentile,
      rank:              parseInt(editingReg.rank || 0, 10),
    } : {};

    updateMutation.mutate({
      email: editingReg.email,
      data:  { ...commonFields, ...admissionExtra },
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
                  <option value="">All Standards / Streams</option>
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

                {/* Caste filter only shown for admission-2026 */}
                {isAdmission && (
                  <select
                    className={styles.selectFilter}
                    value={filterCaste}
                    onChange={e => setFilterCaste(e.target.value)}
                  >
                    <option value="">All Castes</option>
                    {castes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}

                <select
                  className={styles.selectFilter}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  className={styles.selectFilter}
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newer First</option>
                  <option value="oldest">Older First</option>
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
                    <th>Name | Phone | Gender</th>

                    {isAdmission ? (
                      <>
                        <th>STD / Stream | Board | <br />Medium | Caste</th>
                        <th>School Name | <br />Interest</th>
                        <th>Theory % / CGPA | <br />GUJCET %</th>
                        <th>Rank</th>
                      </>
                    ) : (
                      <>
                        <th>Standard / Stream</th>
                        <th>School / College | Medium</th>
                      </>
                    )}

                    <th>Full Address</th>
                    <th>Ref</th>
                    <th>Notes | Remark details</th>
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
                          <div className={styles.phoneWrapper}>
                            <a 
                              href={`tel:${r.phone}`} 
                              className={styles.phoneLink}
                              title="Call"
                            >
                              {r.phone}
                            </a>
                            <button 
                              className={styles.copyBtn} 
                              onClick={() => handleCopy(r.phone)}
                              title="Copy Phone Number"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                          </div>
                          <small className={styles.genderTag}>{r.gender}</small>
                        </div>
                      </td>

                      {isAdmission ? (
                        <>
                          <td>
                            <div className={styles.metaCell}>
                              <span>{r.standard === 'Graduation' ? (r.graduation_degree ? `Graduation - ${r.graduation_degree}` : 'Graduation') : r.standard}</span>
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
                              <span>{r.standard === 'Graduation' ? 'CGPA:' : 'T:'} {r.theory_percentile || '—'}</span>
                              <span>G: {r.gujcet_percentile || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.rankBadge}>
                              {r.rank || 0}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className={styles.metaCell}>
                              <span>{r.standard || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.schoolCell}>
                              <span>{r.school_college || '—'}</span>
                              {r.medium && <small className={styles.genderTag}>{r.medium}</small>}
                            </div>
                          </td>
                        </>
                      )}

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
                  onChange={e => setEditingReg({ ...editingReg, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  value={editingReg.phone}
                  onChange={e => setEditingReg({ ...editingReg, phone: e.target.value })}
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
                  onChange={e => setEditingReg({ ...editingReg, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Medium</label>
                <select
                  value={editingReg.medium}
                  onChange={e => setEditingReg({ ...editingReg, medium: e.target.value })}
                >
                  <option value="Gujarati">Gujarati</option>
                  <option value="English">English</option>
                </select>
              </div>

              {/* Caste only for admission-2026 */}
              {isAdmission && (
                <div className={styles.formGroup}>
                  <label>Caste</label>
                  <select
                    value={editingReg.caste}
                    onChange={e => setEditingReg({ ...editingReg, caste: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="EWS">EWS</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Standard / Stream</label>
                <select
                  value={editingReg.standard}
                  onChange={e => setEditingReg({ ...editingReg, standard: e.target.value })}
                >
                  <option value="">Select Standard / Stream</option>
                  {STANDARDS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {isAdmission && editingReg.standard === 'Graduation' && (
                <div className={styles.formGroup}>
                  <label>Graduation Degree</label>
                  <input
                    type="text"
                    value={editingReg.graduation_degree || ''}
                    onChange={e => setEditingReg({ ...editingReg, graduation_degree: e.target.value })}
                  />
                </div>
              )}
              {isAdmission && (
                <div className={styles.formGroup}>
                  <label>Education Board</label>
                  <select
                    value={editingReg.education_board}
                    onChange={e => setEditingReg({ ...editingReg, education_board: e.target.value })}
                  >
                    <option value="">Select Board</option>
                    {BOARDS_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>School / College</label>
                <input
                  type="text"
                  value={editingReg.school_college}
                  onChange={e => setEditingReg({ ...editingReg, school_college: e.target.value })}
                />
              </div>
              {isAdmission && (
                <div className={styles.formGroup}>
                  <label>Interested Field</label>
                  <input
                    type="text"
                    value={editingReg.interested_field}
                    onChange={e => setEditingReg({ ...editingReg, interested_field: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Theory / GUJCET only for admission-2026 */}
            {isAdmission && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{editingReg.standard === 'Graduation' ? 'CGPA' : 'Theory Percentile'}</label>
                  <input
                    type="text"
                    value={editingReg.theory_percentile}
                    onChange={e => setEditingReg({ ...editingReg, theory_percentile: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>GUJCET Percentile</label>
                  <input
                    type="text"
                    value={editingReg.gujcet_percentile}
                    onChange={e => setEditingReg({ ...editingReg, gujcet_percentile: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Rank</label>
                  <input
                    type="number"
                    value={editingReg.rank || 0}
                    onChange={e => setEditingReg({ ...editingReg, rank: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Reference</label>
              <input
                type="text"
                value={editingReg.reference}
                onChange={e => setEditingReg({ ...editingReg, reference: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Notes / Remark</label>
              <textarea
                value={editingReg.notes}
                onChange={e => setEditingReg({ ...editingReg, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Address</label>
              <textarea
                value={editingReg.address}
                onChange={e => setEditingReg({ ...editingReg, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={editingReg.status}
                onChange={e => setEditingReg({ ...editingReg, status: e.target.value })}
              >
                <option value="registered">Registered</option>
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
