import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, FileDown, CheckCircle2, X } from 'lucide-react';
import PageHeader    from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { getParts, placeOrder, downloadOrderPDF } from '../services/api';

// Parts row: [PART_ID, PART_NAME, PART_CODE, PART_CATEGORY, UNIT_PRICE, STOCK_QTY, MIN_STOCK, ...]

export default function BulkOrder() {
  const [parts,      setParts]      = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [search,     setSearch]     = useState('');
  // cart: { part_id, part_name, unit_price, quantity }
  const [cart,       setCart]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getParts()
      .then(r => setParts(r.data))
      .catch(() => {})
      .finally(() => setLoadingParts(false));
  }, []);

  const filtered = parts.filter(p =>
    !search || p[1]?.toLowerCase().includes(search.toLowerCase()) || p[2]?.toLowerCase().includes(search.toLowerCase())
  );

  const inCart = (partId) => cart.some(c => c.part_id === partId);

  const addToCart = (p) => {
    if (inCart(p[0])) return;
    setCart(c => [...c, { part_id: p[0], part_name: p[1], unit_price: p[4], quantity: 1 }]);
  };

  const removeFromCart = (partId) => setCart(c => c.filter(i => i.part_id !== partId));

  const updateQty = (partId, val) => {
    const q = Math.max(1, Number(val) || 1);
    setCart(c => c.map(i => i.part_id === partId ? { ...i, quantity: q } : i));
  };

  const totalCost = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const cartItems = () => cart.map(i => ({
    part_id:    i.part_id,
    part_name:  i.part_name,
    quantity:   i.quantity,
    unit_price: i.unit_price,
  }));

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return showToast('Cart is empty.', 'error');
    setSubmitting(true);
    try {
      const res = await placeOrder(cartItems());
      setOrderResult(res.data);
      showToast('Order placed successfully!');
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (cart.length === 0) return showToast('Cart is empty.', 'error');
    setPdfLoading(true);
    try {
      await downloadOrderPDF(cartItems());
      showToast('Invoice downloaded!');
    } catch (e) {
      showToast('Failed to download PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5 mt-10">
      {toast && (
        <div className={`toast-shell fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-[rgba(244,107,107,0.86)]' : 'bg-[rgba(255, 0, 51,0.86)]'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14}/></button>
        </div>
      )}

      <PageHeader title="Bulk Parts Order" subtitle="Select parts, set quantities, and generate an invoice" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ─── Parts Catalog ─── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="toolbar-shell p-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search parts by name or code…"
                className="w-full pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="table-shell">
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <p className="text-sm font-semibold text-[#F3F4F4]">Available Parts</p>
              <p className="text-xs text-[rgba(243,244,244,0.52)]">{filtered.length} results</p>
            </div>
            {loadingParts ? <LoadingSpinner /> : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm data-table">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Part</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Add</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No parts found.</td></tr>
                    ) : filtered.map(p => (
                      <tr key={p[0]} className={`transition-colors ${inCart(p[0]) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-100">{p[1]}</p>
                          <p className="text-xs text-gray-400">{p[2]}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-purple-50 text-black font-bold rounded text-xs">{p[3]}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">₹{Number(p[4]).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-600">{Number(p[5]).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center">
                          {inCart(p[0])
                            ? <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium"><CheckCircle2 size={14}/> Added</span>
                            : <button onClick={() => addToCart(p)}
                                className="action-button px-3 py-1 text-xs font-semibold">
                                + Add
                              </button>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── Cart ─── */}
        <div className="space-y-3">
          <div className="section-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-2">
              <ShoppingCart size={16} className="text-[#FF0033]" />
              <p className="text-sm font-semibold text-[#F3F4F4]">Order Cart</p>
              <span className="ml-auto bg-[rgba(255, 0, 51,0.16)] text-[#FF0033] text-xs px-2 py-0.5 rounded-full border border-[rgba(255, 0, 51,0.22)]">{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="px-4 py-10 text-center text-[rgba(243,244,244,0.52)] text-sm">
                <ShoppingCart size={28} className="mx-auto mb-2 text-[rgba(243,244,244,0.32)]" />
                No parts added yet
              </div>
            ) : (
              <div className="divide-y divide-[rgba(255,255,255,0.08)] max-h-72 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.part_id} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-100">{item.part_name}</p>
                        <p className="text-xs text-gray-400">₹{Number(item.unit_price).toLocaleString('en-IN')} each</p>
                      </div>
                      <button onClick={() => removeFromCart(item.part_id)}
                        className="text-red-400 hover:text-red-600 transition p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number" min={1} value={item.quantity}
                        onChange={e => updateQty(item.part_id, e.target.value)}
                        className="w-20 px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500 ml-auto">
                        = ₹{Number(item.unit_price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Total & Buttons ─── */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Total Cost</p>
                <p className="text-lg font-bold text-blue-600">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0}
                className="w-full py-2.5 action-button text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Placing Order…' : 'Place Order'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading || cart.length === 0}
                className="w-full py-2.5 secondary-button text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileDown size={16} />
                {pdfLoading ? 'Generating…' : 'Download Invoice PDF'}
              </button>
              {cart.length > 0 && (
                <button onClick={() => { setCart([]); setOrderResult(null); }}
                  className="w-full py-2 text-xs text-[rgba(243,244,244,0.52)] hover:text-white transition">
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          {/* ─── Order Result ─── */}
          {orderResult && (
            <div className="section-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#9EE2C0] font-semibold text-sm">
                <CheckCircle2 size={16} /> Order Confirmed
              </div>
              <p className="text-sm text-green-700">
                Total: <strong>₹{Number(orderResult.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </p>
              <p className="text-xs text-[rgba(243,244,244,0.52)]">{orderResult.items?.length} line item(s)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
