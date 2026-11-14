import { SAMPLE_DATA } from './sampleData';

const STORAGE_KEY = 'autoline_demo_state_v1';

function getInitialState() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return JSON.parse(JSON.stringify(SAMPLE_DATA));
}

let state = getInitialState();

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Unable to persist demo state:', e);
  }
}

export const demoAdapter = {
  isDemo: true,

  async login(username, password) {
    const user = state.users.find(
      (u) => u.username?.toLowerCase() === username?.trim()?.toLowerCase()
    );
    if (!user) {
      // allow default demo fallback for any demo test
      if (username === 'admin' || !username) {
        return {
          data: {
            user_id: 1,
            username: 'admin',
            displayName: 'System Admin (Demo)',
            role: 'admin',
          },
        };
      }
      throw { response: { status: 401, data: { error: 'Invalid username or password. Try admin / admin' } } };
    }
    return {
      data: {
        user_id: user.user_id,
        username: user.username,
        displayName: user.full_name,
        role: user.user_role || 'admin',
      },
    };
  },

  async getTotalProduction() {
    const total = state.daily_production.reduce((acc, row) => acc + (Number(row.quantity_produced) || 0), 0);
    return { data: { total_production: total || 728 } };
  },

  async getTotalCost() {
    const total = state.parts_usage.reduce((acc, row) => acc + (Number(row.total_cost) || 0), 0);
    return { data: { total_cost: Math.round(total || 48950) } };
  },

  async getDefectRate() {
    const count = state.quality_testing.length || 1;
    const sum = state.quality_testing.reduce((acc, row) => acc + (Number(row.defect_percentage) || 0), 0);
    const avg = (sum / count).toFixed(2);
    return { data: { defect_rate: parseFloat(avg) || 2.14 } };
  },

  async getProductionTrend() {
    return {
      data: {
        today: 48,
        yesterday: 42,
        trend: 14.3,
        direction: 'UP',
      },
    };
  },

  async getDailyProduction(search = '') {
    let rows = state.daily_production.map((r) => {
      const line = state.production_lines.find((l) => l.line_id === r.line_id);
      const model = state.car_models.find((m) => m.model_id === r.model_id);
      return [
        r.production_id,
        r.production_date ? r.production_date.split('T')[0] : '2026-11-14',
        line ? line.line_name : `Line ${r.line_id}`,
        model ? model.model_name : `Model ${r.model_id}`,
        r.quantity_produced,
        r.shift || 'Morning',
      ];
    });
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(q)));
    }
    return { data: rows };
  },

  async postDailyProduction(payload) {
    const newId = (state.daily_production.length ? Math.max(...state.daily_production.map(p => p.production_id || 0)) : 0) + 1;
    const entry = {
      production_id: newId,
      production_date: payload.production_date || new Date().toISOString(),
      line_id: Number(payload.line_id) || 1,
      model_id: Number(payload.model_id) || 1,
      quantity_produced: Number(payload.quantity_produced) || 10,
      shift: payload.shift || 'Day',
    };
    state.daily_production.unshift(entry);
    persist();
    return { data: { message: 'Production record saved', id: newId } };
  },

  async getParts(search = '') {
    let rows = state.parts.map((p) => [
      p.part_id,
      p.part_name,
      p.part_code || `P-${p.part_id}`,
      p.part_category || 'Mechanical',
      Number(p.unit_price) || 50,
      Number(p.stock_quantity) || 100,
      Number(p.min_stock_level) || 20,
      p.last_updated ? p.last_updated.split('T')[0] : '2026-11-14',
    ]);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(q)));
    }
    return { data: rows };
  },

  async getPartsSummary() {
    const totalParts = state.parts.length;
    const lowStock = state.parts.filter(
      (p) => (Number(p.stock_quantity) || 0) <= (Number(p.min_stock_level) || 0)
    ).length;
    const totalValue = state.parts.reduce(
      (acc, p) => acc + (Number(p.unit_price) || 0) * (Number(p.stock_quantity) || 0),
      0
    );
    return {
      data: {
        totalParts,
        lowStock,
        totalValue: Math.round(totalValue),
      },
    };
  },

  async bulkUpdateParts(updates) {
    if (Array.isArray(updates)) {
      updates.forEach((u) => {
        const part = state.parts.find((p) => p.part_id === Number(u.part_id));
        if (part) {
          part.stock_quantity = Number(u.stock_quantity);
          part.last_updated = new Date().toISOString();
        }
      });
      persist();
    }
    return { data: { message: 'Parts updated successfully' } };
  },

  async placeOrder(items) {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const part = state.parts.find((p) => p.part_id === Number(item.part_id));
        if (part) {
          part.stock_quantity = (Number(part.stock_quantity) || 0) + (Number(item.quantity) || 0);
        }
      });
      persist();
    }
    return { data: { message: 'Order placed successfully', order_id: `ORD-${Date.now()}` } };
  },

  async getPartsUsage() {
    const rows = state.parts_usage.map((u) => {
      const part = state.parts.find((p) => p.part_id === u.part_id);
      const line = state.production_lines.find((l) => l.line_id === u.line_id);
      return [
        u.usage_id,
        u.usage_date ? u.usage_date.split('T')[0] : '2026-11-14',
        part ? part.part_name : `Part ${u.part_id}`,
        u.quantity_used,
        u.total_cost,
        line ? line.line_name : `Line ${u.line_id}`,
      ];
    });
    return { data: rows };
  },

  async postPartsUsage(payload) {
    const newId = (state.parts_usage.length ? Math.max(...state.parts_usage.map(p => p.usage_id || 0)) : 0) + 1;
    const part = state.parts.find((p) => p.part_id === Number(payload.part_id));
    const unitPrice = part ? Number(part.unit_price) : 50;
    const qty = Number(payload.quantity_used) || 1;
    const cost = qty * unitPrice;
    state.parts_usage.unshift({
      usage_id: newId,
      usage_date: payload.usage_date || new Date().toISOString(),
      part_id: Number(payload.part_id),
      quantity_used: qty,
      total_cost: cost,
      line_id: Number(payload.line_id) || 1,
    });
    if (part) {
      part.stock_quantity = Math.max(0, (Number(part.stock_quantity) || 0) - qty);
    }
    persist();
    return { data: { message: 'Parts usage logged', id: newId } };
  },

  async getQualityTests() {
    const rows = state.quality_testing.map((q) => {
      const line = state.production_lines.find((l) => l.line_id === q.line_id);
      const model = state.car_models.find((m) => m.model_id === q.model_id);
      return [
        q.test_id,
        q.test_date ? q.test_date.split('T')[0] : '2026-11-14',
        line ? line.line_name : `Line ${q.line_id}`,
        model ? model.model_name : `Model ${q.model_id}`,
        q.units_tested,
        q.units_passed,
        q.defect_percentage,
        q.test_status || (q.units_passed >= q.units_tested ? 'PASS' : 'FLAGGED'),
      ];
    });
    return { data: rows };
  },

  async postQualityTest(payload) {
    const newId = (state.quality_testing.length ? Math.max(...state.quality_testing.map(q => q.test_id || 0)) : 0) + 1;
    const tested = Number(payload.units_tested) || 10;
    const passed = Number(payload.units_passed) || 9;
    const defect_pct = (((tested - passed) / tested) * 100).toFixed(2);
    state.quality_testing.unshift({
      test_id: newId,
      test_date: payload.test_date || new Date().toISOString(),
      line_id: Number(payload.line_id) || 1,
      model_id: Number(payload.model_id) || 1,
      units_tested: tested,
      units_passed: passed,
      defect_percentage: Number(defect_pct),
      test_status: passed >= tested ? 'PASS' : 'FLAGGED',
    });
    persist();
    return { data: { message: 'Quality test recorded', id: newId } };
  },

  async getQualitySummary() {
    const tested = state.quality_testing.reduce((a, b) => a + (Number(b.units_tested) || 0), 0);
    const passed = state.quality_testing.reduce((a, b) => a + (Number(b.units_passed) || 0), 0);
    return {
      data: {
        totalTests: state.quality_testing.length,
        totalUnitsTested: tested,
        totalUnitsPassed: passed,
        averageDefectRate: (tested ? (((tested - passed) / tested) * 100).toFixed(1) : 2.1),
      },
    };
  },

  async getDropdownLines() {
    return { data: state.production_lines.map((l) => [l.line_id, l.line_name]) };
  },

  async getDropdownModels() {
    return { data: state.car_models.map((m) => [m.model_id, m.model_name]) };
  },

  async getLines() {
    return { data: state.production_lines };
  },

  async postLine(data) {
    const newId = (state.production_lines.length ? Math.max(...state.production_lines.map(l => l.line_id || 0)) : 0) + 1;
    state.production_lines.push({ line_id: newId, ...data });
    persist();
    return { data: { message: 'Line added', id: newId } };
  },

  async putLine(id, data) {
    const line = state.production_lines.find((l) => l.line_id === Number(id));
    if (line) Object.assign(line, data);
    persist();
    return { data: { message: 'Line updated' } };
  },

  async getModels(search = '') {
    let rows = state.car_models;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((m) => (m.model_name || '').toLowerCase().includes(q));
    }
    return { data: rows };
  },

  async postModel(data) {
    const newId = (state.car_models.length ? Math.max(...state.car_models.map(m => m.model_id || 0)) : 0) + 1;
    state.car_models.push({ model_id: newId, ...data });
    persist();
    return { data: { message: 'Model added', id: newId } };
  },

  async putModel(id, data) {
    const model = state.car_models.find((m) => m.model_id === Number(id));
    if (model) Object.assign(model, data);
    persist();
    return { data: { message: 'Model updated' } };
  },

  async getEmployees(search = '') {
    let rows = state.employees;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((e) => (e.full_name || '').toLowerCase().includes(q) || (e.role || '').toLowerCase().includes(q));
    }
    return { data: rows };
  },

  async postEmployee(data) {
    const newId = (state.employees.length ? Math.max(...state.employees.map(e => e.employee_id || 0)) : 0) + 1;
    state.employees.push({ employee_id: newId, ...data });
    persist();
    return { data: { message: 'Employee added', id: newId } };
  },

  async putEmployee(id, data) {
    const emp = state.employees.find((e) => e.employee_id === Number(id));
    if (emp) Object.assign(emp, data);
    persist();
    return { data: { message: 'Employee updated' } };
  },

  async getDefectCategories() {
    return { data: state.defect_categories };
  },
};
