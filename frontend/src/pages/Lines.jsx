import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, X, Pencil, Check, Ban } from 'lucide-react';
import PageHeader     from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert     from '../components/ErrorAlert';
import { getLines, postLine, putLine } from '../services/api';
import { useAuth } from '../context/AuthContext';

// GET /lines row (SELECT *):
// 0:line_id, 1:line_name, 2:line_type, 3:status, 4:daily_capacity, 5:created_date, 6:last_updated

const LINE_TYPES = ['Assembly', 'Welding', 'Painting', 'Testing', 'Other'];
const STATUSES   = ['Active', 'Inactive', 'Maintenance'];

const EMPTY_FORM = {
  line_name: '', line_type: '', status: 'Active', daily_capacity: '',
};

export default function Lines() {
  const navigate = useNavigate();
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const { can } = useAuth();
  const [editId,   setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getLines();
      setRows(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ─── Add ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postLine({
        line_name:      form.line_name,
        line_type:      form.line_type      || null,
        status:         form.status,
        daily_capacity: form.daily_capacity ? Number(form.daily_capacity) : null,
      });
      showToast('Production line added!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRows();
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ───
  const startEdit = (r) => {
    setEditId(r[0]);
    setEditForm({
      line_name:      r[1] || '',
      line_type:      r[2] || '',
      status:         r[3] || 'Active',
      daily_capacity: r[4] || '',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await putLine(id, {
        line_name:      editForm.line_name,
        line_type:      editForm.line_type      || null,
        status:         editForm.status,
        daily_capacity: editForm.daily_capacity ? Number(editForm.daily_capacity) : null,
      });
      showToast('Line updated!');
      setEditId(null);
      fetchRows();
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s) => {
    if (s === 'Active')      return 'bg-green-100 text-green-700';
    if (s === 'Maintenance') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-500';
  };

  const inp = 'px-2 py-1 text-xs w-full';

  return (
    <div className="space-y-4 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(244,107,107,0.86)]' : 'bg-[rgba(255, 0, 51,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Production Lines" subtitle="Manage production lines, status and capacity">
        <button onClick={() => navigate('/settings')}
          className="secondary-button px-3 py-2 text-sm">
          ← Back
        </button>
        <button onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold">
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Add Line'}
        </button>
      </PageHeader>

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="form-shell p-6">
          <h2 className="font-semibold text-[#F3F4F4] mb-4 industrial-heading tracking-[0.12em]">New Production Line</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Line Name *</label>
              <input required value={form.line_name}
                onChange={e => setForm(f => ({ ...f, line_name: e.target.value }))}
                placeholder="e.g. Assembly Line A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Line Type</label>
              <select value={form.line_type}
                onChange={e => setForm(f => ({ ...f, line_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select type…</option>
                {LINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
              <select required value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Daily Capacity</label>
              <input type="number" min={1} value={form.daily_capacity}
                onChange={e => setForm(f => ({ ...f, daily_capacity: e.target.value }))}
                placeholder="e.g. 200"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                {submitting ? 'Saving…' : 'Save Line'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-shell">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#F3F4F4]">All Lines</p>
          <p className="text-xs text-[rgba(243,244,244,0.52)]">{rows.length} records</p>
        </div>
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={fetchRows} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['ID', 'Line Name', 'Type', 'Status', 'Daily Capacity', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No lines found.</td></tr>
                ) : rows.map((r, i) => {
                  const isEditing = editId === r[0];
                  return (
                    <tr key={i} className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-400">{r[0]}</td>

                      {isEditing ? (
                        <>
                          <td className="px-2 py-2"><input value={editForm.line_name} onChange={e => setEditForm(f => ({ ...f, line_name: e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2">
                            <select value={editForm.line_type} onChange={e => setEditForm(f => ({ ...f, line_type: e.target.value }))} className={inp}>
                              <option value="">—</option>
                              {LINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min={1} value={editForm.daily_capacity} onChange={e => setEditForm(f => ({ ...f, daily_capacity: e.target.value }))} className={inp} />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleSave(r[0])} disabled={saving}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                                <Check size={12} /> {saving ? '…' : 'Save'}
                              </button>
                              <button onClick={cancelEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-300 transition">
                                <Ban size={12} /> Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-800">{r[1]}</td>
                          <td className="px-4 py-3 text-gray-600">{r[2] || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(r[3])}`}>{r[3]}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{r[4] ? Number(r[4]).toLocaleString('en-IN') : '—'}</td>
                          <td className="px-4 py-3">
                            {can('canEdit') && (
                          <button onClick={() => startEdit(r)}
                            className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition">
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
