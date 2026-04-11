import {
  LayoutDashboard,
  Factory,
  Package,
  ClipboardList,
  ShoppingCart,
  RefreshCw,
  FlaskConical,
  BarChart2,
  Settings,
} from 'lucide-react';

export const mainNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/production', label: 'Production', icon: Factory },
  { to: '/parts', label: 'Parts Inventory', icon: Package },
  { to: '/parts-usage', label: 'Parts Usage', icon: ClipboardList },
  { to: '/bulk-order', label: 'Bulk Order', icon: ShoppingCart },
  { to: '/bulk-stock-update', label: 'Stock Update', icon: RefreshCw, permission: 'canBulkStockUpdate' },
  { to: '/quality', label: 'Quality', icon: FlaskConical },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export const settingsNavItem = {
  to: '/settings',
  label: '⚙️',
  icon: Settings,
  permission: 'canAccessSettings',
};
