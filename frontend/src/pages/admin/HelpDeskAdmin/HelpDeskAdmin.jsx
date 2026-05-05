import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';
import Loader from '@/components/ui/Loader/Loader';
import Button from '@/components/ui/Button/Button';
import { helpDeskAPI } from '@/services/api';
import toast from 'react-hot-toast';
import regStyles from '../Registrations/Registrations.module.css';
import styles from './HelpDeskAdmin.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isUrl(s) {
  if (!s || typeof s !== 'string') return false;
  return s.startsWith('http://') || s.startsWith('https://');
}

function displayDate(date) {
  if (!date || date.trim() === '') return <span className={styles.announceSoon}>Announce Soon</span>;
  return date;
}

const EMPTY_FORM = {
  body: '',
  course: '',
  eligibility: '',
  start_date: '',
  end_date: '',
  link: '',
  link2: '',
  sort_order: 0,
};

const SORT_OPTIONS = [
  { value: 'custom', label: 'Custom Order' },
  { value: 'alpha', label: 'Alphabetical (A-Z)' },
  { value: 'date', label: 'Start Date (earliest first)' },
  { value: 'recent', label: 'Recently Added' },
];

const SORT_HELP = [
  { label: 'Custom Order', desc: 'Manual order set via the "Order" field on each row.' },
  { label: 'Alphabetical (A–Z)', desc: 'Sorts by Governing Body name A → Z.' },
  { label: 'Start Date (earliest first)', desc: 'Rows with specific dates appear first; "Announce Soon" entries go to the bottom.' },
  { label: 'Recently Added', desc: 'Newest entries appear at the top.' },
];

// ─── Data hook ───────────────────────────────────────────────────────────────

function useHelpDeskEntries() {
  return useQuery({
    queryKey: ['helpdesk-entries-admin'],
    queryFn: async () => {
      const { data } = await helpDeskAPI.list();
      return data;
    },
    staleTime: 0, // Always refetch on mount
  });
}

function useHelpDeskSettings() {
  return useQuery({
    queryKey: ['helpdesk-settings'],
    queryFn: async () => {
      const { data } = await helpDeskAPI.getSettings();
      return data;
    },
  });
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ entry, onConfirm, onCancel, isPending }) {
  if (!entry) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>🗑️</div>
        <h3 className={styles.modalTitle}>Delete Entry?</h3>
        <p className={styles.modalMessage}>
          Remove <strong>{entry.body}</strong> — <strong>{entry.course.slice(0, 40)}</strong>?
        </p>
        <p className={styles.modalWarning}>This action cannot be undone.</p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onCancel} disabled={isPending} type="button">
            Cancel
          </button>
          <button className={styles.modalDeleteBtn} onClick={onConfirm} disabled={isPending} type="button">
            {isPending ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ entries, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.previewModalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>👁 Preview — as seen by users on /help-desk</h3>
          <button className={styles.previewCloseBtn} onClick={onClose} type="button">✕</button>
        </div>
        <div className={styles.previewTableWrapper}>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                <th>Governing Body / University</th>
                <th>Course</th>
                <th>Eligibility</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Registration Link</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row, index) => {
                const url1 = isUrl(row.link) ? row.link : null;
                const url2 = isUrl(row.link2) ? row.link2 : null;
                const linkAsText = row.link && !url1 ? row.link : null;
                return (
                  <tr key={row.entry_id || index}>
                    <td>{row.body}</td>
                    <td>
                      <span className={styles.courseBadge}>
                        {row.course.split('\n').map((line, i, arr) => (
                          <React.Fragment key={i}>
                            {line}{i < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </span>
                    </td>
                    <td>{row.eligibility}</td>
                    <td>{displayDate(row.start_date)}</td>
                    <td>{displayDate(row.end_date)}</td>
                    <td>
                      <div className={styles.previewLinkContent}>
                        {linkAsText && <span className={styles.previewLinkText}>{linkAsText}</span>}
                        <div className={styles.previewBtnGroup}>
                          {url1 && <a href={url1} target="_blank" rel="noopener noreferrer" className={styles.previewApplyBtn}>Apply Now</a>}
                          {url2 && <a href={url2} target="_blank" rel="noopener noreferrer" className={styles.previewDetailsBtn}>Details</a>}
                        </div>
                        {!url1 && !url2 && !linkAsText && <span className={styles.announceSoon}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr><td colSpan={6} className={styles.emptyPreview}>No entries to preview.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Help Popover ────────────────────────────────────────────────────────

function SortHelpPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className={styles.sortHelpWrap} ref={ref}>
      <button
        className={styles.sortHelpBtn}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Sorting guide"
      >
        Sorting Guide
      </button>
      {open && (
        <div className={styles.sortHelpPanel}>
          <p className={styles.sortHelpTitle}>📊 Sort Options Explained</p>
          {SORT_HELP.map((h) => (
            <div key={h.label} className={styles.sortHelpItem}>
              <span className={styles.sortHelpLabel}>{h.label}</span>
              <span className={styles.sortHelpDesc}>{h.desc}</span>
            </div>
          ))}
          <div className={styles.sortHelpFooter}>
            💡 Tip: Use "Custom Order" to arrange entries exactly as you want them to appear to users.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit Form Row ──────────────────────────────────────────────────────

function EntryFormRow({ form, onChange, onSave, onCancel, isSaving, isNew }) {
  return (
    <tr className={styles.formRow}>
      {/* Body */}
      <td>
        <input
          className={styles.formInput}
          placeholder="Governing body…"
          value={form.body}
          onChange={(e) => onChange('body', e.target.value)}
        />
      </td>
      {/* Course */}
      <td>
        <textarea
          className={styles.formTextarea}
          placeholder={"Course name\n(use \\n for line breaks)"}
          value={form.course}
          onChange={(e) => onChange('course', e.target.value)}
          rows={2}
        />
      </td>
      {/* Eligibility */}
      <td>
        <input
          className={styles.formInput}
          placeholder="Eligibility…"
          value={form.eligibility}
          onChange={(e) => onChange('eligibility', e.target.value)}
        />
      </td>
      {/* Start Date */}
      <td>
        <div className={styles.dateField}>
          <input
            className={styles.formInput}
            placeholder="e.g. 2-Apr-2025"
            value={form.start_date}
            onChange={(e) => onChange('start_date', e.target.value)}
          />
          {form.start_date && (
            <button
              type="button"
              className={styles.dateClearBtn}
              onClick={() => onChange('start_date', '')}
              title="Clear date (shows Announce Soon)"
            >✕</button>
          )}
          {!form.start_date && <span className={styles.dateHint}>→ Announce Soon</span>}
        </div>
      </td>
      {/* End Date */}
      <td>
        <div className={styles.dateField}>
          <input
            className={styles.formInput}
            placeholder="e.g. 9-Jun-2025"
            value={form.end_date}
            onChange={(e) => onChange('end_date', e.target.value)}
          />
          {form.end_date && (
            <button
              type="button"
              className={styles.dateClearBtn}
              onClick={() => onChange('end_date', '')}
              title="Clear date (shows Announce Soon)"
            >✕</button>
          )}
          {!form.end_date && <span className={styles.dateHint}>→ Announce Soon</span>}
        </div>
      </td>
      {/* Links */}
      <td>
        <div className={styles.linkFieldGroup}>
          <input
            className={styles.formInput}
            placeholder="Apply Now URL (link)"
            value={form.link}
            onChange={(e) => onChange('link', e.target.value)}
          />
          <input
            className={styles.formInput}
            placeholder="Details URL (link2)"
            value={form.link2}
            onChange={(e) => onChange('link2', e.target.value)}
          />
          <input
            className={`${styles.formInput} ${styles.orderInput}`}
            type="number"
            placeholder="Order #"
            value={form.sort_order}
            onChange={(e) => onChange('sort_order', parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </td>
      {/* Actions */}
      <td>
        <div className={regStyles.editActions}>
          <button
            className={regStyles.saveBtn}
            onClick={onSave}
            disabled={isSaving}
            title={isNew ? 'Add entry' : 'Save changes'}
            type="button"
          >
            {isSaving ? '…' : '✓'}
          </button>
          <button
            className={regStyles.cancelBtn}
            onClick={onCancel}
            title="Cancel"
            type="button"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HelpDeskAdmin() {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading, isFetching } = useHelpDeskEntries();

  const [sortBy, setSortBy] = useState('custom');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM });
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // ── Settings ────────────────────────────────────────────────────────────────
  const { data: settingsData } = useHelpDeskSettings();

  useEffect(() => {
    if (settingsData?.default_sort) {
      setSortBy(settingsData.default_sort);
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSort) => helpDeskAPI.updateSettings({ default_sort: newSort }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-settings'] });
      // Also invalidate public entries just in case (though they fetch fresh)
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries'] });
    },
    onError: () => toast.error('Failed to save sort preference'),
  });

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateSettingsMutation.mutate(newSort);
  };

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const list = [...entries];
    switch (sortBy) {
      case 'alpha':
        return list.sort((a, b) => a.body.localeCompare(b.body));
      case 'date':
        return list.sort((a, b) => {
          const hasA = a.start_date && a.start_date.trim() !== '';
          const hasB = b.start_date && b.start_date.trim() !== '';
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          return a.start_date.localeCompare(b.start_date);
        });
      case 'recent':
        return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      case 'custom':
      default:
        return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
  }, [entries, sortBy]);

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => helpDeskAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries-admin'] });
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries'] });
      toast.success('Entry added successfully');
      setIsAddingNew(false);
      setNewForm({ ...EMPTY_FORM });
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to add entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => helpDeskAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries-admin'] });
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries'] });
      toast.success('Entry updated');
      setEditingId(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => helpDeskAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries-admin'] });
      queryClient.invalidateQueries({ queryKey: ['helpdesk-entries'] });
      toast.success('Entry deleted');
      setDeleteEntry(null);
      setEditingId(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Delete failed'),
  });

  // ── Edit handlers ──────────────────────────────────────────────────────────────
  const handleStartEdit = (entry) => {
    setEditingId(entry.entry_id);
    setEditForm({
      body: entry.body || '',
      course: entry.course || '',
      eligibility: entry.eligibility || '',
      start_date: entry.start_date || '',
      end_date: entry.end_date || '',
      link: entry.link || '',
      link2: entry.link2 || '',
      sort_order: entry.sort_order ?? 0,
    });
    setIsAddingNew(false);
  };

  const handleEditChange = (field, value) => setEditForm((p) => ({ ...p, [field]: value }));

  const handleSaveEdit = (id) => {
    const { body, course, eligibility } = editForm;
    if (!body.trim() || !course.trim() || !eligibility.trim()) {
      return toast.error('Body, Course and Eligibility are required');
    }
    updateMutation.mutate({ id, data: editForm });
  };

  // ── Add handlers ───────────────────────────────────────────────────────────────
  const handleStartAdd = () => {
    setIsAddingNew(true);
    setNewForm({ ...EMPTY_FORM, sort_order: entries.length + 1 });
    setEditingId(null);
  };

  const handleNewChange = (field, value) => setNewForm((p) => ({ ...p, [field]: value }));

  const handleSaveNew = () => {
    const { body, course, eligibility } = newForm;
    if (!body.trim() || !course.trim() || !eligibility.trim()) {
      return toast.error('Body, Course and Eligibility are required');
    }
    createMutation.mutate(newForm);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['helpdesk-entries-admin'] });
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className={regStyles.layout}>
      <AdminSidebar />
      <div className={regStyles.main}>

        {/* ─── Header ─── */}
        <div className={regStyles.header}>
          <div>
            <h1 className={regStyles.pageTitle}>Help Desk Manager</h1>
            <p className={regStyles.subtitle}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · Changes reflect on /help-desk immediately
            </p>
          </div>
          <div className={regStyles.headerActions}>
            <Button variant="secondary" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? 'Refreshing…' : '↺ Refresh'}
            </Button>
            <Button variant="secondary" onClick={() => setShowPreview(true)}>
              👁 Preview
            </Button>
            <Button onClick={handleStartAdd} disabled={isAddingNew}>
              + Add Entry
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Loader text="Loading entries…" />
        ) : (
          <div className={regStyles.tableCard}>

            {/* ─── Toolbar: Sort ─── */}
            <div className={styles.toolbarRow}>
              <div className={styles.sortRow}>
                <label className={styles.sortLabel} htmlFor="hd-sort">Sort by:</label>
                <select
                  id="hd-sort"
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <SortHelpPopover />
              </div>
              <span className={regStyles.resultCount}>
                {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* ─── Table ─── */}
            <div className={regStyles.tableWrapper}>
              <table className={`${regStyles.table} ${styles.adminTable}`}>
                <thead>
                  <tr>
                    <th>Governing Body / University</th>
                    <th>Course</th>
                    <th>Eligibility</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Registration Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ── Add New Row (at top) ── */}
                  {isAddingNew && (
                    <EntryFormRow
                      form={newForm}
                      onChange={handleNewChange}
                      onSave={handleSaveNew}
                      onCancel={() => setIsAddingNew(false)}
                      isSaving={createMutation.isPending}
                      isNew
                    />
                  )}

                  {sorted.map((row) => {
                    const isEditing = editingId === row.entry_id;
                    const url1 = isUrl(row.link) ? row.link : null;
                    const url2 = isUrl(row.link2) ? row.link2 : null;
                    const linkAsText = row.link && !url1 ? row.link : null;

                    if (isEditing) {
                      return (
                        <EntryFormRow
                          key={row.entry_id}
                          form={editForm}
                          onChange={handleEditChange}
                          onSave={() => handleSaveEdit(row.entry_id)}
                          onCancel={() => setEditingId(null)}
                          isSaving={updateMutation.isPending}
                          isNew={false}
                        />
                      );
                    }

                    return (
                      <tr key={row.entry_id}>
                        <td className={styles.bodyCell}>{row.body}</td>

                        <td>
                          <span className={styles.courseBadge}>
                            {row.course.split('\n').map((line, i, arr) => (
                              <React.Fragment key={i}>
                                {line}{i < arr.length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </span>
                        </td>

                        <td>{row.eligibility}</td>

                        <td className={styles.dateCell}>
                          {displayDate(row.start_date)}
                        </td>

                        <td className={styles.dateCell}>
                          {displayDate(row.end_date)}
                        </td>

                        <td>
                          <div className={styles.linkContent}>
                            {linkAsText && <span className={styles.linkText}>{linkAsText}</span>}
                            <div className={styles.btnGroup}>
                              {url1 && <a href={url1} target="_blank" rel="noopener noreferrer" className={styles.applyBtn}>Apply Now</a>}
                              {url2 && <a href={url2} target="_blank" rel="noopener noreferrer" className={styles.detailsBtn}>Details</a>}
                            </div>
                            {!url1 && !url2 && !linkAsText && <span className={styles.announceSoon}>—</span>}
                          </div>
                        </td>

                        <td>
                          <div className={regStyles.editActions}>
                            <button
                              className={regStyles.editBtn}
                              onClick={() => handleStartEdit(row)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className={styles.deleteIconBtn}
                              onClick={() => setDeleteEntry(row)}
                              type="button"
                              title="Delete entry"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {sorted.length === 0 && !isAddingNew && (
                    <tr>
                      <td colSpan={7} className={regStyles.emptyRow}>
                        No entries yet. Click "+ Add Entry" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      <DeleteConfirmModal
        entry={deleteEntry}
        onConfirm={() => deleteMutation.mutate(deleteEntry.entry_id)}
        onCancel={() => setDeleteEntry(null)}
        isPending={deleteMutation.isPending}
      />

      {showPreview && (
        <PreviewModal entries={sorted} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
