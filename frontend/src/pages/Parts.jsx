import { useState, useEffect, useCallback } from 'react';
import { Search, X, Package, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert    from '../components/ErrorAlert';
import StatCard      from '../components/StatCard';
import { getParts, getPartsSummary, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

// PARTS row indices:
// 0:PART_ID 1:PART_NAME 2:PART_CODE 3:PART_CATEGORY 4:UNIT_PRICE
// 5:STOCK_QUANTITY 6:MIN_STOCK_LEVEL 7:SUPPLIER_NAME 8:DESCRIPTION 9:LAST_UPDATED

function StockBadge({ stock, min }) {
  if (stock === 0)
    return <span className="px-2 py-0.5 bg-red-950/40 text-red-400 rounded-full text-xs font-semibold">OUT</span>;
  if (stock < min)
    return <span className="px-2 py-0.5 bg-yellow-950/40 text-yellow-400 rounded-full text-xs font-semibold">LOW</span>;
  return <span className="px-2 py-0.5 bg-green-950/40 text-green-400 rounded-full text-xs font-semibold">OK</span>;
}

export default function Parts() {
  const [parts,   setParts]   = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('ALL'); // ALL | LOW | OUT | OK

  const fetchParts = useCallback(async (q = '') => {
    setLoading(true); setError(null);
    try {
      const [pr, sr] = await Promise.all([getParts(q), getPartsSummary()]);
      setParts(pr.data);
      setSummary(sr.data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnChange(fetchParts);

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    fetchParts(v);
  };

  const getStockStatus = (stock, min) => {
    if (stock === 0) return 'OUT';
    if (stock < min) return 'LOW';
    return 'OK';
  };

  const displayed = filter === 'ALL'
    ? parts
    : parts.filter(p => getStockStatus(p[5], p[6]) === filter);

  const fmtVal = (v) => {
    if (!v && v !== 0) return '—';
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${Number(v).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-5 mt-10">
      <PageHeader title="Parts Inventory" subtitle="Monitor stock levels and parts data" />

      {/* ─── Summary Cards ─── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Parts"          value={summary.total_parts}                               icon={Package}       color="blue"   />
          <StatCard title="Inventory Value"      value={fmtVal(summary.total_inventory_value)}             icon={DollarSign}    color="green"  />
          <StatCard title="Low Stock Parts"      value={summary.low_stock_count}    subtitle="Below min level" icon={TrendingDown}  color="yellow" />
          <StatCard title="Out of Stock"         value={summary.out_of_stock_count} subtitle="Zero quantity"   icon={AlertTriangle} color="red"    />
        </div>
      )}

      {/* ─── Filters + Search ─── */}
        <div className="toolbar-shell p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search parts…"
              className="w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); fetchParts(); }}
              className="ghost-button text-xs flex items-center gap-1 px-2 py-1">
              <X size={13} /> Clear
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {['ALL', 'OK', 'LOW', 'OUT'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-button px-3 py-1.5 text-xs font-medium ${
                  filter === f
                    ? 'active'
                    : ''
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-xs text-[rgba(243,244,244,0.52)]">{displayed.length} parts</p>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="table-shell">
        {loading ? <LoadingSpinner />
        : error   ? <ErrorAlert message={error} onRetry={() => fetchParts(search)} />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-red-900/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Part Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Min Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/30">
                {displayed.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400">No parts found.</td></tr>
                ) : displayed.map((p, i) => (
                  <tr key={i} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{p[0]}</td>
                    <td className="px-4 py-3 font-medium text-white">{p[1]}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p[2]}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-orange-950/40 text-orange-400 rounded-md text-xs font-medium">{p[3]}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-200">₹{Number(p[4]).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-white">{Number(p[5]).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-neutral-500">{p[6]}</td>
                    <td className="px-4 py-3"><StockBadge stock={p[5]} min={p[6]} /></td>
                    <td className="px-4 py-3 text-neutral-400 text-xs whitespace-nowrap">{p[7] ? new Date(p[7].replace(' ', 'T')).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
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
