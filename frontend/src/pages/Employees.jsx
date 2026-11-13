import { useState, useEffect, useCallback } from 'react';
import { Search, X, PlusCircle, Pencil, Check, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import PageHeader     from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert     from '../components/ErrorAlert';
import { getEmployees, getDropdownLines, postEmployee, putEmployee, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

const EMPTY_FORM = {
  employee_name: '', employee_code: '', designation: '',
  line_id: '', email: '', phone: '',
  joining_date: new Date().toISOString().slice(0, 10),
  is_active: 'Y',
};

export default function Employees() {
  const navigate = useNavigate();

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [lines,      setLines]      = useState([]);
  const { can } = useAuth();

  // editing
  const [editId,   setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async (q = '') => {
    setLoading(true); setError(null);
    try {
      const res = await getEmployees(q);
      setRows(res.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnChange(fetchRows);
  useEffect(() => {
    getDropdownLines().then(r => setLines(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    fetchRows(v);
  };

  // ─── Add ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postEmployee({
        employee_name: form.employee_name,
        employee_code: form.employee_code,
        designation:   form.designation   || null,
        line_id:       form.line_id       ? Number(form.line_id) : null,
        email:         form.email         || null,
        phone:         form.phone         || null,
        joining_date:  form.joining_date,
        is_active:     form.is_active,
      });
      showToast('Employee added successfully!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRows(search);
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
      employee_name: r[1] || '',
      employee_code: r[2] || '',
      designation:   r[3] || '',
      line_id:       r[4] || '',
      email:         r[5] || '',
      phone:         r[6] || '',
      joining_date:  r[7]
        ? (typeof r[7] === 'string' ? r[7].slice(0, 10) : new Date(r[7]).toISOString().slice(0, 10))
        : '',
      is_active: r[8] || 'Y',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await putEmployee(id, {
        ...editForm,
        line_id: editForm.line_id ? Number(editForm.line_id) : null,
      });
      showToast('Employee updated!');
      setEditId(null);
      fetchRows(search);
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  // shared input style
  const inp = 'px-2 py-1 text-xs w-full';

  return (
    <div className="space-y-4 my-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(255,38,38,0.86)]' : 'bg-[rgba(255,38,38,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Employees" subtitle="Manage factory employees">
        <button
          onClick={() => navigate('/settings')}
          className="secondary-button px-3 py-2 text-sm"
        >
          ← Back
        </button>
        <button
          onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Add Employee'}
        </button>
      </PageHeader>

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="form-shell p-6">
          <h2 className="font-semibold text-[#F3F4F4] mb-4 industrial-heading tracking-[0.12em]">New Employee</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Name *</label>
              <input required value={form.employee_name}
                onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))}
                placeholder="Full name"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Employee Code *</label>
              <input required value={form.employee_code}
                onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))}
                placeholder="e.g. EMP001"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Designation</label>
              <input value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. Supervisor"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Line</label>
              <select value={form.line_id}
                onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              >
                <option value="">Select line…</option>
                {lines.map(l => <option key={l[0]} value={l[0]}>{l[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@factory.com"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Phone</label>
              <input value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 9999999999"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Joining Date</label>
              <input type="date" value={form.joining_date}
                onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Active</label>
              <select value={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stroke"
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" disabled={submitting}
                className="tm-btn tm-btn--solid disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Search ─── */}
      <div className="toolbar-shell p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={handleSearch} placeholder="Search by name…"
              className="w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); fetchRows(); }}
              className="ghost-button text-xs flex items-center gap-1 px-2 py-1">
              <X size={13} /> Clear
            </button>
          )}
          <p className="ml-auto text-xs text-[rgba(243,244,244,0.52)]">{rows.length} employees</p>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="table-shell">
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={() => fetchRows(search)} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-line">
                  {['ID', 'Name', 'Code', 'Designation', 'Email', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-400">No employees found.</td></tr>
                ) : rows.map((r, i) => {
                  const isEditing = editId === r[0];
                  return (
                    <tr key={i} className={`transition-colors ${isEditing ? 'bg-panel-2' : 'hover:bg-[#0a0a0a]'}`}>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-400">{r[0]}</td>

                      {isEditing ? (
                        <>
                          <td className="px-2 py-2"><input value={editForm.employee_name} onChange={e => setEditForm(f => ({ ...f, employee_name: e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2"><input value={editForm.employee_code} onChange={e => setEditForm(f => ({ ...f, employee_code: e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2"><input value={editForm.designation}   onChange={e => setEditForm(f => ({ ...f, designation:   e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2"><input value={editForm.email}         onChange={e => setEditForm(f => ({ ...f, email:         e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2"><input value={editForm.phone}         onChange={e => setEditForm(f => ({ ...f, phone:         e.target.value }))} className={inp} /></td>
                          <td className="px-2 py-2">
                            <select value={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value }))} className={inp}>
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
                          <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r[2]}</td>
                          <td className="px-4 py-3 text-neutral-400">{r[3] || '—'}</td>
                          <td className="px-4 py-3 text-neutral-400">{r[5] || '—'}</td>
                          <td className="px-4 py-3 text-neutral-400">{r[6] || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r[8] === 'Y' ? 'bg-green-950/40 text-green-400' : 'bg-[#0a0a0a] text-neutral-500'}`}>
                              {r[8] === 'Y' ? 'Active' : 'Inactive'}
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
