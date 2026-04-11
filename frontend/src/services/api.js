import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getTotalProduction = () => api.get('/dashboard/total-production');
export const getTotalCost       = () => api.get('/dashboard/total-cost');
export const getDefectRate      = () => api.get('/dashboard/defect-rate');
export const getProductionTrend = () => api.get('/dashboard/production-trend');

// ─── PRODUCTION ──────────────────────────────────────────────────────────────
// Returns rows: [production_id, production_date, line_name, model_name, quantity_produced, shift]
export const getDailyProduction  = (search = '') =>
  api.get('/dailyproduction', { params: search ? { search } : {} });

export const postDailyProduction = (data) => api.post('/dailyproduction', data);

// ─── PARTS ───────────────────────────────────────────────────────────────────
// Returns rows: [PART_ID, PART_NAME, PART_CODE, PART_CATEGORY, UNIT_PRICE, STOCK_QUANTITY, MIN_STOCK_LEVEL, SUPPLIER_NAME, DESCRIPTION, LAST_UPDATED]
export const getParts        = (search = '') =>
  api.get('/parts', { params: search ? { search } : {} });

export const getPartsSummary = () => api.get('/parts/summary');

export const bulkUpdateParts = (updates) =>
  api.post('/parts/bulk-update', { updates });

export const placeOrder = (items) =>
  api.post('/parts/order', { items });

export const downloadOrderPDF = async (items) => {
  const response = await axios.post('/api/parts/order/pdf', { items }, {
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', 'invoice.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── PARTS USAGE ─────────────────────────────────────────────────────────────
// Returns rows: [usage_id, usage_date, part_name, quantity_used, total_cost, line_name]
export const getPartsUsage  = () => api.get('/partsusage');
export const postPartsUsage = (data) => api.post('/partsusage', data);

// ─── QUALITY ─────────────────────────────────────────────────────────────────
export const getQualityTests  = () => api.get('/qualitytest');
export const postQualityTest  = (data) => api.post('/qualitytest', data);

// ─── DROPDOWNS ───────────────────────────────────────────────────────────────
// Returns [[line_id, line_name], ...]
export const getDropdownLines  = () => api.get('/dropdown/lines');
export const getDropdownModels = () => api.get('/dropdown/models');

// ─── SETTINGS / FULL TABLES ──────────────────────────────────────────────────
export const getLines      = () => api.get('/lines');
export const getModels     = (search = '') =>
  api.get('/models', { params: search ? { search } : {} });

export const getEmployees  = (search = '') =>
  api.get('/employees', { params: search ? { search } : {} });
export const postEmployee = (data) => api.post('/employees', data);

export const getUsers      = () => api.get('/users');
export const getDefectCategories = () => api.get('/defectcategory');
export const postLine  = (data) => api.post('/lines', data);
export const postModel = (data) => api.post('/models', data);
export const loginUser = (username, password) =>
  api.post('/auth/login', { username, password });
export const putEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const putModel    = (id, data) => api.put(`/models/${id}`, data);
export const putLine     = (id, data) => api.put(`/lines/${id}`, data);
export const getQualitySummary = () => api.get('/qualitytest/summary');
export default api;
