# 🏭 AutoFactory – Car Manufacturing Factory Management Frontend

A complete React + Tailwind CSS frontend for a Car Manufacturing Factory Management System, fully integrated with a Node.js + Express + Oracle SQL backend.

---

## 📦 Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| UI         | React 19, Tailwind CSS v4              |
| Routing    | react-router-dom v7                    |
| HTTP       | axios                                  |
| Charts     | recharts                               |
| Icons      | lucide-react                           |
| Bundler    | Vite 7                                 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Backend running at `http://localhost:8080`

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm start
```

The app will run at **http://localhost:3000** and proxy all `/api/*` requests to your backend at `http://localhost:8080`.

---

## 📁 Folder Structure

```
src/
├── services/
│   └── api.js              # All Axios API calls (single source of truth)
├── components/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Topbar.jsx           # Top bar with date/user
│   ├── StatCard.jsx         # KPI stat card
│   ├── LoadingSpinner.jsx   # Reusable loading UI
│   ├── ErrorAlert.jsx       # Error display with retry
│   └── PageHeader.jsx       # Page title + action slot
└── pages/
    ├── Dashboard.jsx         # KPI cards + production trend chart
    ├── Production.jsx        # Daily production table + add form
    ├── Parts.jsx             # Parts inventory + summary + stock status
    ├── PartsUsage.jsx        # Parts usage log + add form
    ├── BulkOrder.jsx         # Multi-part order + PDF invoice download
    ├── BulkStockUpdate.jsx   # Bulk ADD/SUBTRACT/SET stock operations
    └── Quality.jsx           # Quality test log + history table
```

---

## 🔌 API Integration

All API calls are in `src/services/api.js`. Vite proxies `/api/*` → `http://localhost:8080/*`.

| Page              | Endpoints Used                                         |
|-------------------|--------------------------------------------------------|
| Dashboard         | `/dashboard/total-production` `/total-cost` `/defect-rate` `/production-trend` |
| Production        | `GET/POST /dailyproduction`                            |
| Parts             | `GET /parts` `/parts/summary`                          |
| Parts Usage       | `GET/POST /partsusage`                                 |
| Bulk Order        | `POST /parts/order` `POST /parts/order/pdf`            |
| Bulk Stock Update | `POST /parts/bulk-update`                              |
| Quality           | `GET/POST /qualitytest`                                |
| Dropdowns         | `/dropdown/lines` `/dropdown/models` `/employees`      |

---

## ✅ Features

- **Dashboard** — Live KPI cards (production, cost, defect rate, trend) + Today vs Yesterday line chart
- **Production** — Searchable table, sortable columns, add new record with all dropdowns
- **Parts Inventory** — Stock status badges (OK/LOW/OUT), filter by status, summary cards
- **Parts Usage** — Usage log with part auto-price fill
- **Bulk Order** — Part catalog with cart, dynamic total cost calculation, PDF invoice download
- **Bulk Stock Update** — ADD / SUBTRACT / SET operations with live preview
- **Quality Testing** — Auto-calculate failed cars, pass rate preview, full history table

---

## ⚙️ Environment

The proxy is configured in `vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

To change the backend URL, edit the `target` in `vite.config.js`.
