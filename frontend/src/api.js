import axios from 'axios';
import { demoAdapter } from './demoAdapter';

// When running on GitHub Pages (or static export), always route to the client-side demo adapter.
const isStaticDemo = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.pathname.startsWith('/AutoLine') ||
  import.meta.env.VITE_DEMO_MODE === 'true'
);

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to fallback to demo adapter on network failure or in demo mode
async function callOrDemo(axiosCall, demoCall) {
  if (isStaticDemo) {
    return demoCall();
  }
  try {
    return await axiosCall();
  } catch (err) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.response.status === 404) {
      return demoCall();
    }
    throw err;
  }
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getTotalProduction = () =>
  callOrDemo(() => api.get('/dashboard/total-production'), () => demoAdapter.getTotalProduction());

export const getTotalCost = () =>
  callOrDemo(() => api.get('/dashboard/total-cost'), () => demoAdapter.getTotalCost());

export const getDefectRate = () =>
  callOrDemo(() => api.get('/dashboard/defect-rate'), () => demoAdapter.getDefectRate());

export const getProductionTrend = () =>
  callOrDemo(() => api.get('/dashboard/production-trend'), () => demoAdapter.getProductionTrend());

// ─── PRODUCTION ──────────────────────────────────────────────────────────────
export const getDailyProduction = (search = '') =>
  callOrDemo(
    () => api.get('/dailyproduction', { params: search ? { search } : {} }),
    () => demoAdapter.getDailyProduction(search)
  );

export const postDailyProduction = (data) =>
  callOrDemo(() => api.post('/dailyproduction', data), () => demoAdapter.postDailyProduction(data));

// ─── PARTS ───────────────────────────────────────────────────────────────────
export const getParts = (search = '') =>
  callOrDemo(
    () => api.get('/parts', { params: search ? { search } : {} }),
    () => demoAdapter.getParts(search)
  );

export const getPartsSummary = () =>
  callOrDemo(() => api.get('/parts/summary'), () => demoAdapter.getPartsSummary());

export const bulkUpdateParts = (updates) =>
  callOrDemo(() => api.post('/parts/bulk-update', { updates }), () => demoAdapter.bulkUpdateParts(updates));

export const placeOrder = (items) =>
  callOrDemo(() => api.post('/parts/order', { items }), () => demoAdapter.placeOrder(items));

export const downloadOrderPDF = async (items) => {
  if (isStaticDemo) {
    const textContent = `AUTOLINE PARTS PURCHASE ORDER\nGenerated: ${new Date().toISOString()}\n\n` +
      items.map(it => `Part #${it.part_id}: ${it.quantity} units`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AutoLine_Purchase_Order.txt');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return;
  }
  const response = await axios.post('/api/parts/order/pdf', { items }, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'invoice.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── PARTS USAGE ─────────────────────────────────────────────────────────────
export const getPartsUsage = () =>
  callOrDemo(() => api.get('/partsusage'), () => demoAdapter.getPartsUsage());

export const postPartsUsage = (data) =>
  callOrDemo(() => api.post('/partsusage', data), () => demoAdapter.postPartsUsage(data));

// ─── QUALITY ─────────────────────────────────────────────────────────────────
export const getQualityTests = () =>
  callOrDemo(() => api.get('/qualitytest'), () => demoAdapter.getQualityTests());

export const postQualityTest = (data) =>
  callOrDemo(() => api.post('/qualitytest', data), () => demoAdapter.postQualityTest(data));

// ─── DROPDOWNS ───────────────────────────────────────────────────────────────
export const getDropdownLines = () =>
  callOrDemo(() => api.get('/dropdown/lines'), () => demoAdapter.getDropdownLines());

export const getDropdownModels = () =>
  callOrDemo(() => api.get('/dropdown/models'), () => demoAdapter.getDropdownModels());

// ─── SETTINGS / FULL TABLES ──────────────────────────────────────────────────
export const getLines = () =>
  callOrDemo(() => api.get('/lines'), () => demoAdapter.getLines());

export const getModels = (search = '') =>
  callOrDemo(
    () => api.get('/models', { params: search ? { search } : {} }),
    () => demoAdapter.getModels(search)
  );

export const getEmployees = (search = '') =>
  callOrDemo(
    () => api.get('/employees', { params: search ? { search } : {} }),
    () => demoAdapter.getEmployees(search)
  );

export const postEmployee = (data) =>
  callOrDemo(() => api.post('/employees', data), () => demoAdapter.postEmployee(data));

export const getDefectCategories = () =>
  callOrDemo(() => api.get('/defectcategory'), () => demoAdapter.getDefectCategories());

export const postLine = (data) =>
  callOrDemo(() => api.post('/lines', data), () => demoAdapter.postLine(data));

export const postModel = (data) =>
  callOrDemo(() => api.post('/models', data), () => demoAdapter.postModel(data));

export const loginUser = (username, password) =>
  callOrDemo(
    () => api.post('/auth/login', { username, password }),
    () => demoAdapter.login(username, password)
  );

export const putEmployee = (id, data) =>
  callOrDemo(() => api.put(`/employees/${id}`, data), () => demoAdapter.putEmployee(id, data));

export const putModel = (id, data) =>
  callOrDemo(() => api.put(`/models/${id}`, data), () => demoAdapter.putModel(id, data));

export const putLine = (id, data) =>
  callOrDemo(() => api.put(`/lines/${id}`, data), () => demoAdapter.putLine(id, data));

export const getQualitySummary = () =>
  callOrDemo(() => api.get('/qualitytest/summary'), () => demoAdapter.getQualitySummary());

export default api;

// ─── ERRORS ──────────────────────────────────────────────────────────────────
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const serverMessage = error?.response?.data?.error;
  if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error?.response) return 'Cannot reach the AutoLine server. Check that the backend is running.';
  if (error.response.status >= 500) return 'The server hit an unexpected error. Please try again shortly.';
  return fallback;
};
