import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/auth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Parts from './pages/Parts';
import PartsUsage from './pages/PartsUsage';
import BulkOrder       from './pages/BulkOrder';
import BulkStockUpdate from './pages/BulkStockUpdate';
import Quality from './pages/Quality';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Employees from './pages/Employees';
import Models from './pages/Models';
import Lines from './pages/Lines';
import BrandBar from './components/brand/BrandBar';
import BrandFooter from './components/brand/BrandFooter';

function ProtectedRoute({ children, permission }) {
  const { can } = useAuth();
  if (permission && !can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="w-12 h-12 bg-red-950/40 rounded-full flex items-center justify-center">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <p className="font-semibold text-neutral-200">Access Restricted</p>
        <p className="text-sm text-neutral-400">You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <BrandBar project="AutoLine — Manufacturing Systems" />
        <div className="flex-1">
          <Login />
        </div>
        <BrandFooter />
      </div>
    );
  }

  return (
    <div className="app-shell bg-black flex flex-col">
      <BrandBar project="AutoLine — Manufacturing Systems" />
      <Navbar />
      <main className="app-main">
        <div className="app-content">
          <Routes>
            <Route path="/home"                element={<Home />} />
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/production"          element={<Production />} />
            <Route path="/parts"               element={<Parts />} />
            <Route path="/parts-usage"         element={<PartsUsage />} />
            <Route path="/bulk-order"          element={<BulkOrder />} />
            <Route path="/bulk-stock-update"   element={
              <ProtectedRoute permission="canBulkStockUpdate">
                <BulkStockUpdate />
              </ProtectedRoute>
            } />
            <Route path="/quality"             element={<Quality />} />
            <Route path="/analytics"           element={<Analytics />} />
            <Route path="/settings"            element={
              <ProtectedRoute permission="canAccessSettings">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/settings/employees"  element={
              <ProtectedRoute permission="canAccessSettings">
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/settings/models"     element={
              <ProtectedRoute permission="canAccessSettings">
                <Models />
              </ProtectedRoute>
            } />
            <Route path="/settings/lines"      element={
              <ProtectedRoute permission="canAccessSettings">
                <Lines />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
