import { useState, useEffect, useCallback } from 'react';
import { Search, PlusCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert    from '../components/ErrorAlert';
import {
  getDailyProduction, postDailyProduction,
  getDropdownLines, getDropdownModels, getEmployees,
} from '../services/api';

const SHIFTS = ['Morning', 'Evening', 'Night'];

const EMPTY_FORM = {
  production_date: new Date().toISOString().slice(0, 10),
  line_id: '', model_id: '', quantity_produced: '',
  shift: '', supervisor_id: '', notes: '', created_by: 'admin',
};

export default function Production() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast,    setToast]    = useState(null);

  const [lines,     setLines]     = useState([]);
  const [models,    setModels]    = useState([]);
  const [employees, setEmployees] = useState([]);

  // Sort
  const [sortCol,  setSortCol]  = useState(1); // index
  const [sortDir,  setSortDir]  = useState('desc');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async (q = '') => {
    setLoading(true); setError(null);
    try {
      const res = await getDailyProduction(q);
      setRows(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Load dropdown data
  useEffect(() => {
    getDropdownLines().then(r => setLines(r.data)).catch(() => {});
    getDropdownModels().then(r => setModels(r.data)).catch(() => {});
    getEmployees().then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    fetchRows(v);
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postDailyProduction({
        ...form,
        line_id:           Number(form.line_id),
        model_id:          Number(form.model_id),
        quantity_produced: Number(form.quantity_produced),
        supervisor_id:     form.supervisor_id ? Number(form.supervisor_id) : null,
      });
      showToast('Production record added successfully!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRows(search);
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const COLS = [
    { label: 'ID',       idx: 0 },
    { label: 'Date',     idx: 1 },
    { label: 'Line',     idx: 2 },
    { label: 'Model',    idx: 3 },
    { label: 'Qty',      idx: 4 },
    { label: 'Shift',    idx: 5 },
  ];

  const SortIcon = ({ col }) =>
    sortCol !== col ? null
    : sortDir === 'asc'
    ? <ChevronUp size={13} className="inline ml-1" />
    : <ChevronDown size={13} className="inline ml-1" />;

  return (
    <div className="space-y-4 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(244,107,107,0.86)]' : 'bg-[rgba(255, 0, 51,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Daily Production" subtitle="View and manage production records">
        <button
          onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Add Record'}
        </button>
      </PageHeader>

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="form-shell p-6">
          <h2 className="font-semibold text-[#F3F4F4] mb-4 industrial-heading tracking-[0.12em]">New Production Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" required value={form.production_date}
                onChange={e => setForm(f => ({ ...f, production_date: e.target.value }))}
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Production Line *</label>
              <select required value={form.line_id}
                onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select line…</option>
                {lines.map(l => <option key={l[0]} value={l[0]}>{l[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Car Model *</label>
              <select required value={form.model_id}
                onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select model…</option>
                {models.map(m => <option key={m[0]} value={m[0]}>{m[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
              <input type="number" min={1} required value={form.quantity_produced}
                onChange={e => setForm(f => ({ ...f, quantity_produced: e.target.value }))}
                placeholder="e.g. 120"
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shift *</label>
              <select required value={form.shift}
                onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select shift…</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supervisor</label>
              <select value={form.supervisor_id}
                onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select supervisor…</option>
                {employees.map(emp => <option key={emp[0]} value={emp[0]}>{emp[1]}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                className="px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" disabled={submitting}
                className="action-button px-6 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Search ─── */}
      <div className="toolbar-shell p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by model, line or shift…"
              className="w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); fetchRows(); }}
              className="ghost-button text-xs flex items-center gap-1 px-2 py-1">
              <X size={13} /> Clear
            </button>
          )}
          <p className="ml-auto text-xs text-[rgba(243,244,244,0.52)]">{rows.length} records</p>
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
                <tr className="bg-gray-50 border-b border-gray-200">
                  {COLS.map(c => (
                    <th
                      key={c.idx}
                      onClick={() => handleSort(c.idx)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                    >
                      {c.label}<SortIcon col={c.idx} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No records found.</td></tr>
                ) : sortedRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{row[0]}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row[1]
                        ? (typeof row[1] === 'string'
                            ? row[1].slice(0, 10)
                            : new Date(row[1]).toLocaleDateString('en-IN'))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row[2] || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{row[3] || '—'}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{Number(row[4]).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row[5] === 'Morning'   ? 'bg-yellow-100 text-yellow-700'
                        : row[5] === 'Afternoon' ? 'bg-orange-100 text-orange-700'
                        : 'bg-indigo-100 text-indigo-700'
                      }`}>{row[5]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
