import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, X, FlaskConical } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert    from '../components/ErrorAlert';
import {
  getQualityTests, postQualityTest,
  getDropdownLines, getDropdownModels, getEmployees,
} from '../services/api';

const SHIFTS = ['Morning', 'Afternoon', 'Night'];

const EMPTY = {
  test_date: new Date().toISOString().slice(0, 10),
  line_id: '', model_id: '', production_id: '',
  cars_tested: '', cars_passed: '', cars_failed: '',
  inspector_id: '', shift: '', notes: '',
};

// Quality row indices (SELECT *): varies — typically:
// test_id, test_date, line_id, model_id, production_id,
// cars_tested, cars_passed, cars_failed, defect_percentage, inspector_id, shift, notes

export default function Quality() {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [toast,     setToast]     = useState(null);

  const [lines,     setLines]     = useState([]);
  const [models,    setModels]    = useState([]);
  const [employees, setEmployees] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTests = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getQualityTests();
      setRows(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);
  useEffect(() => {
    getDropdownLines().then(r => setLines(r.data)).catch(() => {});
    getDropdownModels().then(r => setModels(r.data)).catch(() => {});
    getEmployees().then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  // Auto-calculate cars_failed when tested/passed change
  const handleTestedChange = (val) => {
    const tested = Number(val) || 0;
    const passed = Number(form.cars_passed) || 0;
    setForm(f => ({
      ...f,
      cars_tested: val,
      cars_failed: tested > 0 && passed <= tested ? String(tested - passed) : f.cars_failed,
    }));
  };

  const handlePassedChange = (val) => {
    const tested = Number(form.cars_tested) || 0;
    const passed = Number(val) || 0;
    setForm(f => ({
      ...f,
      cars_passed: val,
      cars_failed: tested > 0 && passed <= tested ? String(tested - passed) : f.cars_failed,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postQualityTest({
        ...form,
        line_id:      Number(form.line_id),
        model_id:     Number(form.model_id),
        cars_tested:  Number(form.cars_tested),
        cars_passed:  Number(form.cars_passed),
        cars_failed:  Number(form.cars_failed),
        inspector_id: form.inspector_id ? Number(form.inspector_id) : null,
        production_id: form.production_id ? Number(form.production_id) : null,
      });
      showToast('Quality test recorded!');
      setShowForm(false);
      setForm(EMPTY);
      fetchTests();
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const passRate = (passed, tested) => {
    if (!tested) return null;
    return ((Number(passed) / Number(tested)) * 100).toFixed(1);
  };

  return (
    <div className="space-y-5 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(244,107,107,0.86)]' : 'bg-[rgba(255, 0, 51,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Quality Testing" subtitle="Log and review quality inspection results">
        <button
          onClick={() => setShowForm(s => !s)}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <PlusCircle size={16} />
          {showForm ? 'Cancel' : 'Log Test'}
        </button>
      </PageHeader>

      {/* ─── Form ─── */}
      {showForm && (
        <div className="form-shell p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-[#FF0033]" />
            <h2 className="font-semibold text-[#F3F4F4] industrial-heading tracking-[0.12em]">New Quality Test Entry</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Test Date *</label>
              <input type="date" required value={form.test_date}
                onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Cars Tested *</label>
              <input type="number" min={1} required value={form.cars_tested}
                onChange={e => handleTestedChange(e.target.value)}
                placeholder="e.g. 100"
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cars Passed *</label>
              <input type="number" min={0} required value={form.cars_passed}
                onChange={e => handlePassedChange(e.target.value)}
                placeholder="e.g. 95"
                className="px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cars Failed *</label>
              <input type="number" min={0} required value={form.cars_failed}
                onChange={e => setForm(f => ({ ...f, cars_failed: e.target.value }))}
                placeholder="Auto-calculated"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Inspector</label>
              <select value={form.inspector_id}
                onChange={e => setForm(f => ({ ...f, inspector_id: e.target.value }))}
                className="px-3 py-2 text-sm"
              >
                <option value="">Select inspector…</option>
                {employees.map(emp => <option key={emp[0]} value={emp[0]}>{emp[1]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Production ID (optional)</label>
              <input type="number" value={form.production_id}
                onChange={e => setForm(f => ({ ...f, production_id: e.target.value }))}
                placeholder="Link to production record"
                className="px-3 py-2 text-sm"
              />
            </div>

            {/* Live pass rate preview */}
            {form.cars_tested && form.cars_passed && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className={`rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-3 ${
                  passRate(form.cars_passed, form.cars_tested) >= 95 ? 'section-card text-[#9EE2C0]' : 'section-card text-[#FFD796]'
                }`}>
                  Pass Rate Preview:&nbsp;<strong>{passRate(form.cars_passed, form.cars_tested)}%</strong>
                  <span className="text-xs font-normal opacity-70">
                    ({form.cars_passed} passed / {form.cars_tested} tested)
                  </span>
                </div>
              </div>
            )}

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
                {submitting ? 'Saving…' : 'Save Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── History Table ─── */}
      <div className="table-shell">
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <p className="font-semibold text-[#F3F4F4] text-sm">Test History</p>
          <p className="text-xs text-[rgba(243,244,244,0.52)]">{rows.length} records</p>
        </div>
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={fetchTests} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['ID', 'Date', 'Line', 'Model', 'Tested', 'Passed', 'Failed', 'Defect %', 'Shift'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No quality tests found.</td></tr>
                ) : rows.map((r, i) => {
                  // SELECT * columns: test_id[0], test_date[1], line_id[2], model_id[3],
                  // production_id[4], cars_tested[5], cars_passed[6], cars_failed[7],
                  // defect_percentage[8], inspector_id[9], shift[10], notes[11]
                  const defect = r[8] != null ? Number(r[8]).toFixed(2) : null;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{r[0]}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {r[1] ? (typeof r[1] === 'string' ? r[1].slice(0,10) : new Date(r[1]).toLocaleDateString('en-IN')) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r[2]}</td>
                      <td className="px-4 py-3 text-gray-600">{r[3]}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r[5]}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{r[6]}</td>
                      <td className="px-4 py-3 text-red-500 font-medium">{r[7]}</td>
                      <td className="px-4 py-3">
                        {defect !== null ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            Number(defect) > 10 ? 'bg-red-100 text-red-700'
                            : Number(defect) > 5 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                          }`}>{defect}%</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r[10] === 'Morning' ? 'bg-yellow-100 text-yellow-700'
                          : r[10] === 'Afternoon' ? 'bg-orange-100 text-orange-700'
                          : 'bg-indigo-100 text-indigo-700'
                        }`}>{r[10]}</span>
                      </td>
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
