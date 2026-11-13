import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, X } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert    from '../components/ErrorAlert';
import { getPartsUsage, postPartsUsage, getDropdownLines, getParts, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

// Usage row: [usage_id, usage_date, part_name, quantity_used, total_cost, line_name]

const EMPTY = {
  usage_date: new Date().toISOString().slice(0, 10),
  part_id: '', quantity_used: '', unit_price: '', line_id: '', production_id: '',
};

export default function PartsUsage() {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [lines,     setLines]     = useState([]);
  const [parts,     setParts]     = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getPartsUsage();
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
    getParts().then(r => setParts(r.data)).catch(() => {});
  }, []);

  const handlePartChange = (partId) => {
    const part = parts.find(p => String(p[0]) === String(partId));
    setForm(f => ({
      ...f,
      part_id:    partId,
      unit_price: part ? part[4] : '',
    }));
  };

  const calculatedTotal = form.quantity_used && form.unit_price
    ? (Number(form.quantity_used) * Number(form.unit_price)).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postPartsUsage({
        ...form,
        part_id:      Number(form.part_id),
        quantity_used: Number(form.quantity_used),
        unit_price:   Number(form.unit_price),
        line_id:      Number(form.line_id),
        production_id: form.production_id ? Number(form.production_id) : null,
      });
      showToast('Parts usage record added!');
      setShowForm(false);
      setForm(EMPTY);
      fetchRows();
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(255,38,38,0.86)]' : 'bg-[rgba(255,38,38,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Parts Usage" subtitle="Track which parts were used and on which lines">
        <button
          onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Log Usage'}
        </button>
      </PageHeader>

      {showForm && (
        <div className="form-shell p-6">
          <h2 className="font-semibold text-[#F3F4F4] mb-4 industrial-heading tracking-[0.12em]">New Parts Usage Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Date *</label>
              <input type="date" required value={form.usage_date}
                onChange={e => setForm(f => ({ ...f, usage_date: e.target.value }))}
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Part *</label>
              <select required value={form.part_id}
                onChange={e => handlePartChange(e.target.value)}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select part…</option>
                {parts.map(p => <option key={p[0]} value={p[0]}>{p[1]} (₹{p[4]})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Line *</label>
              <select required value={form.line_id}
                onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select line…</option>
                {lines.map(l => <option key={l[0]} value={l[0]}>{l[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Quantity Used *</label>
              <input type="number" min={1} required value={form.quantity_used}
                onChange={e => setForm(f => ({ ...f, quantity_used: e.target.value }))}
                placeholder="e.g. 50"
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Unit Price *</label>
              <input type="number" min={0} step="0.01" required value={form.unit_price}
                onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                placeholder="Auto-filled from part"
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Production ID (optional)</label>
              <input type="number" value={form.production_id}
                onChange={e => setForm(f => ({ ...f, production_id: e.target.value }))}
                placeholder="Link to production record"
                className="px-3 py-2 text-sm"
              />
            </div>

            {calculatedTotal && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="section-card px-4 py-2 text-sm text-[#FF2626] font-medium">
                  Calculated Total Cost: ₹{Number(calculatedTotal).toLocaleString('en-IN')}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" disabled={submitting}
                className="action-button px-6 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-shell">
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={fetchRows} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-line">
                  {['ID', 'Date', 'Part', 'Qty Used', 'Total Cost', 'Line'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">No usage records found.</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{r[0]}</td>
                    <td className="px-4 py-3 text-neutral-200">
                      {r[1] ? (typeof r[1] === 'string' ? r[1].slice(0,10) : new Date(r[1]).toLocaleDateString('en-IN')) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{r[2]}</td>
                    <td className="px-4 py-3 text-neutral-200">{Number(r[3]).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-green-400">₹{Number(r[4]).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-panel-2 text-white rounded-md text-xs font-medium">{r[5]}</span>
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
