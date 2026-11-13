import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Plus, Minus, Settings, X, CheckCircle2 } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { getParts, bulkUpdateParts, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

// Parts row: [0:PART_ID, 1:PART_NAME, 2:PART_CODE, 3:PART_CATEGORY, 4:UNIT_PRICE, 5:STOCK_QTY, 6:MIN_STOCK, ...]

const OP_ICONS = {
  ADD:      <Plus  size={13} />,
  SUBTRACT: <Minus size={13} />,
  SET:      <Settings size={13} />,
};
const OP_COLORS = {
  ADD:      'bg-green-950/40 text-green-400 border-green-500/40',
  SUBTRACT: 'bg-red-950/40   text-red-400   border-red-500/40',
  SET:      'bg-panel-2 text-white border-stroke',
};

export default function BulkStockUpdate() {
  const [parts,      setParts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  // updates: { [part_id]: { type: 'ADD'|'SUBTRACT'|'SET', quantity: number } }
  const [updates,    setUpdates]    = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getParts();
      setParts(r.data);
    } catch (e) {
      showToast('Failed to load parts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useLoadOnChange(fetchParts);

  const filtered = parts.filter(p =>
    !search ||
    p[1]?.toLowerCase().includes(search.toLowerCase()) ||
    p[2]?.toLowerCase().includes(search.toLowerCase())
  );

  const setOp = (partId, type) => {
    setUpdates(u => ({
      ...u,
      [partId]: { type, quantity: u[partId]?.quantity || 1 },
    }));
  };

  const setQty = (partId, val) => {
    const q = Math.max(0, Number(val) || 0);
    setUpdates(u => ({
      ...u,
      [partId]: { ...u[partId], quantity: q },
    }));
  };

  const clearRow = (partId) => {
    setUpdates(u => {
      const next = { ...u };
      delete next[partId];
      return next;
    });
  };

  const pendingList = Object.entries(updates)
    .filter(([, v]) => v.type && v.quantity > 0)
    .map(([id, v]) => ({ part_id: Number(id), type: v.type, quantity: v.quantity }));

  const previewStock = (partId, currentStock) => {
    const u = updates[partId];
    if (!u || !u.type || !u.quantity) return null;
    if (u.type === 'ADD')      return currentStock + Number(u.quantity);
    if (u.type === 'SUBTRACT') return Math.max(0, currentStock - Number(u.quantity));
    if (u.type === 'SET')      return Number(u.quantity);
    return null;
  };

  const handleSubmit = async () => {
    if (pendingList.length === 0) return showToast('No updates to submit.', 'error');
    setSubmitting(true);
    try {
      await bulkUpdateParts(pendingList);
      showToast(`${pendingList.length} part(s) updated successfully!`);
      setUpdates({});
      fetchParts();
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(255,38,38,0.86)]' : 'bg-[rgba(255,38,38,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14}/></button>
        </div>
      )}

      <PageHeader title="Bulk Stock Update" subtitle="Update stock quantities for multiple parts at once" />

      {/* ─── Pending Banner ─── */}
      {pendingList.length > 0 && (
        <div className="section-card px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FF2626] text-sm font-medium">
            <CheckCircle2 size={16} />
            {pendingList.length} part(s) staged for update
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="action-button px-5 py-2 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={14} className={submitting ? 'animate-spin' : ''} />
            {submitting ? 'Updating…' : 'Apply All Updates'}
          </button>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="toolbar-shell p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter parts…"
            className="w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>
        {Object.keys(updates).length > 0 && (
          <button onClick={() => setUpdates({})} className="ghost-button text-xs px-2 py-1">
            Clear All
          </button>
        )}
        <p className="ml-auto text-xs text-[rgba(243,244,244,0.52)]">{filtered.length} parts shown</p>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-4 text-xs text-[rgba(243,244,244,0.58)]">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"/> ADD — increases current stock</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"/>   SUBTRACT — decreases current stock</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white inline-block"/> SET — replaces stock with entered value</div>
      </div>

      {/* ─── Table ─── */}
      <div className="table-shell">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-line">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Part</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase">Operation</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase">Preview</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase">Clear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-400">No parts found.</td></tr>
                ) : filtered.map(p => {
                  const pid      = p[0];
                  const upd      = updates[pid];
                  const preview  = previewStock(pid, p[5]);
                  const hasUpdate = upd && upd.type;

                  return (
                    <tr key={pid} className={`transition-colors ${hasUpdate ? 'bg-panel-2' : 'hover:bg-[#0a0a0a]'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-100">{p[1]}</p>
                        <p className="text-xs text-neutral-400">{p[2]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-panel-2 text-black font-bold rounded text-xs">{p[3]}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-neutral-200">
                        {Number(p[5]).toLocaleString('en-IN')}
                        {p[5] < p[6] && p[5] > 0 && <span className="ml-1 text-white text-xs">(LOW)</span>}
                        {p[5] === 0 && <span className="ml-1 text-red-500 text-xs">(OUT)</span>}
                      </td>

                      {/* Operation buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {['ADD', 'SUBTRACT', 'SET'].map(op => (
                            <button
                              key={op}
                              onClick={() => setOp(pid, op)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition ${
                                upd?.type === op
                                  ? OP_COLORS[op] + ' ring-1 ring-offset-1 ring-current'
                                  : 'border-line text-neutral-500 hover:border-line'
                              }`}
                            >
                              {OP_ICONS[op]} {op}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Qty input */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={upd?.quantity ?? ''}
                          onChange={e => setQty(pid, e.target.value)}
                          disabled={!upd?.type}
                          placeholder="—"
                          className="w-20 px-2 py-1 text-sm text-center disabled:opacity-40"
                        />
                      </td>

                      {/* Preview */}
                      <td className="px-4 py-3 text-center">
                        {preview !== null ? (
                          <span className={`font-semibold text-sm ${preview < p[6] ? 'text-white' : preview === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            → {Number(preview).toLocaleString('en-IN')}
                          </span>
                        ) : <span className="text-neutral-300 text-xs">—</span>}
                      </td>

                      {/* Clear */}
                      <td className="px-4 py-3 text-center">
                        {hasUpdate && (
                          <button onClick={() => clearRow(pid)} className="text-red-400 hover:text-red-600 transition">
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Submit Button at Bottom ─── */}
      {pendingList.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="action-button px-8 py-3 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} className={submitting ? 'animate-spin' : ''} />
            {submitting ? 'Updating Stock…' : `Apply ${pendingList.length} Update(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
