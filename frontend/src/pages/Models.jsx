import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { PlusCircle, X, Pencil, Check, Ban } from 'lucide-react';
import PageHeader     from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert     from '../components/ErrorAlert';
import { getModels, postModel, putModel, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';


// GET /models row (explicit column list in routes/settings.js):
// 0:model_id, 1:model_name, 2:model_type, 3:base_price,
// 4:model_code, 5:description, 6:is_active

const MODEL_TYPES = ['Sedan', 'SUV', 'Hatchback', 'MUV', 'Truck', 'Van', 'Other'];

const EMPTY_FORM = {
  model_name: '', model_type: '', base_price: '',
  model_code: '', description: '', isactive: 'Y',
};

export default function Models() {
  const navigate = useNavigate();
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);

  const [editId,   setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);
  const { can } = useAuth();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getModels();
      setRows(res.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnChange(fetchRows);

  // ─── Add ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postModel({
        model_name:  form.model_name,
        model_type:  form.model_type  || null,
        base_price:  form.base_price  ? Number(form.base_price) : null,
        model_code:  form.model_code  || null,
        description: form.description || null,
        isactive:    form.isactive,
      });
      showToast('Car model added!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRows();
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ───
  const startEdit = (r) => {
    setEditId(r[0]);
    setEditForm({
      model_name:  r[1] || '',
      model_type:  r[2] || '',
      base_price:  r[3] || '',
      model_code:  r[4] || '',
      description: r[5] || '',
      isactive:    r[6] || 'Y',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await putModel(id, {
        model_name:  editForm.model_name,
        model_type:  editForm.model_type  || null,
        base_price:  editForm.base_price  ? Number(editForm.base_price) : null,
        model_code:  editForm.model_code  || null,
        description: editForm.description || null,
        isactive:    editForm.isactive,
      });
      showToast('Model updated!');
      setEditId(null);
      fetchRows();
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'px-2 py-1 text-xs w-full';

  return (
    <div className="space-y-4 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(255,38,38,0.86)]' : 'bg-[rgba(255,38,38,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Car Models" subtitle="Manage car models, types and pricing">
        <button onClick={() => navigate('/settings')}
          className="secondary-button px-3 py-2 text-sm">
          ← Back
        </button>
        <button onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold">
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Add Model'}
        </button>
      </PageHeader>

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="form-shell p-6">
          <h2 className="font-semibold text-[#F3F4F4] mb-4 industrial-heading tracking-[0.12em]">New Car Model</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Model Name *</label>
              <input required value={form.model_name}
                onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
                placeholder="e.g. Swift Dzire"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Model Code</label>
              <input value={form.model_code}
                onChange={e => setForm(f => ({ ...f, model_code: e.target.value }))}
                placeholder="e.g. SD-01"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Model Type</label>
              <select value={form.model_type}
                onChange={e => setForm(f => ({ ...f, model_type: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              >
                <option value="">Select type…</option>
                {MODEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Base Price (₹)</label>
              <input type="number" min={0} value={form.base_price}
                onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                placeholder="e.g. 850000"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Active</label>
              <select value={form.isactive}
                onChange={e => setForm(f => ({ ...f, isactive: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
              <input value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" disabled={submitting}
                className="tm-btn tm-btn--solid disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save Model'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-shell">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#F3F4F4]">All Models</p>
          <p className="text-xs text-[rgba(243,244,244,0.52)]">{rows.length} records</p>
        </div>
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={fetchRows} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-line">
                  {['ID', 'Name', 'Code', 'Type', 'Base Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-400">No models found.</td></tr>
                ) : rows.map((r, i) => {
                  const isEditing = editId === r[0];
                  return (
                    <tr key={i} className={`transition-colors ${isEditing ? 'bg-panel-2' : 'hover:bg-[#0a0a0a]'}`}>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-400">{r[0]}</td>

                      {isEditing ? (
                        <>
                          <td className="px-2 py-2"><input value={editForm.model_name}  onChange={e => setEditForm(f => ({ ...f, model_name:  e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2"><input value={editForm.model_code}  onChange={e => setEditForm(f => ({ ...f, model_code:  e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2">
                            <select value={editForm.model_type} onChange={e => setEditForm(f => ({ ...f, model_type: e.target.value }))} className={inp}>
                              <option value="">—</option>
                              {MODEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2"><input type="number" value={editForm.base_price} onChange={e => setEditForm(f => ({ ...f, base_price: e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2">
                            <select value={editForm.isactive} onChange={e => setEditForm(f => ({ ...f, isactive: e.target.value }))} className={inp}>
                              <option value="Y">Active</option>
                              <option value="N">Inactive</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleSave(r[0])} disabled={saving}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                                <Check size={12} /> {saving ? '…' : 'Save'}
                              </button>
                              <button onClick={cancelEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-[#141414] text-neutral-400 text-xs rounded-lg hover:bg-[#141414] transition">
                                <Ban size={12} /> Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-white">{r[1]}</td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r[4] || '—'}</td>
                          <td className="px-4 py-3">
                            {r[2] ? <span className="px-2 py-0.5 bg-panel-2 text-white rounded text-xs">{r[2]}</span> : '—'}
                          </td>
                          <td className="px-4 py-3 text-neutral-200">{r[3] ? `₹${Number(r[3]).toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r[6] === 'Y' ? 'bg-green-950/40 text-green-400' : 'bg-[#0a0a0a] text-neutral-500'}`}>
                              {r[6] === 'Y' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                           {can('canEdit') && (
                            <button onClick={() => startEdit(r)}
                              className="flex items-center gap-1 px-2 py-1 border border-line text-neutral-400 text-xs rounded-lg hover:bg-[#0a0a0a] transition">
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
