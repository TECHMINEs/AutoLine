# 🏭 AutoLine Systems
### Car Manufacturing Production & Quality Management Platform

AutoLine Systems is a full-stack web application built to digitize and 
streamline factory floor operations for a car manufacturing plant. 
Designed as a Database Systems course project, it bridges a React-powered 
frontend with a Node.js/Express REST API backend connected to an Oracle 
database — with a local SQLite fallback for development.

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts  |
| Backend    | Node.js, Express.js                     |
| Database   | Oracle DB (SQLite for local dev)        |
| Auth       | Role-based access (Admin / Operator)    |
| Extras     | PDFKit (bill generation), dotenv        |

---

## 🚀 Features

### 📊 Live Dashboard
Real-time KPIs at a glance — total units produced, cumulative parts cost,
average defect rate, and a day-over-day production trend indicator showing
percentage change from yesterday to today.

### 🔩 Parts & Inventory Management
Full catalog of manufacturing parts with stock levels, unit prices, and
minimum stock thresholds. Supports bulk stock updates (Add / Subtract / Set),
low-stock and out-of-stock alerts, and a bulk order flow that automatically
restocks inventory and generates a downloadable PDF bill.

### 🚗 Daily Production Tracking
Log production runs by line, car model, shift, and supervisor. On every
new production entry, parts consumption is automatically calculated and
inserted into the Parts Usage table using the Bill of Materials — zero
manual effort required.

### ✅ Quality Control
Record quality test results per production line and car model including
cars tested, passed, and failed. Defect percentages are computed and
surfaced in summary views broken down by line and by model.

### 📈 Analytics
Visual breakdowns of defect trends, production volumes, and cost summaries
across lines and models using interactive Recharts graphs.

### ⚙️ Settings & Administration
Manage production lines, car models, parts, employees, and defect categories
through dedicated settings pages. Role-based route protection ensures
operators cannot access admin-only sections.

---

## 🗄️ Database Schema Highlights
- `DAILY_PRODUCTION` → `PARTS_USAGE` auto-insert via Oracle PL/SQL block
- `BILL_OF_MATERIALS` drives automated parts consumption per car model
- `QUALITY_TESTING` stores defect percentages per test session
- `SYSTEM_ALERTS`, `AUDIT_LOG`, `SAVED_REPORTS` for enterprise-grade ops

---

## 🏃 Running Locally

```bash
# Backend
cd backend
npm install
node init_db.js
node server.js        # Runs on http://localhost:8080

# Frontend
cd frontend
npm install
npm run dev           # Runs on http://localhost:5173
```

---

## 👤 Default Login
| Role     | Username | Password     |
|----------|----------|--------------|
| Admin    | admin    | admin        |
| Operator | user1    | password123  |

---

*Built as part of a Database Systems (DBS) course project.*
