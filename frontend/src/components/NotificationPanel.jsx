import { useState, useEffect, useCallback } from 'react';
import {
  Bell, X, Package, AlertTriangle,
  TrendingDown, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { getParts, getQualitySummary } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

const SEV = {
  critical: { label: 'Critical' },
  warning: { label: 'Warning' },
  info: { label: 'Info' },
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Async only: every setState happens after an await, so this is safe to call from an effect
  const buildNotifications = useCallback(async () => {
    const notes = [];
    const failures = [];

    try {
      const partsRes = await getParts();
      const parts = partsRes.data;

      parts.forEach(p => {
        const stock = Number(p[5]);
        const min = Number(p[6]);
        if (stock === 0) {
          notes.push({
            id: `part-out-${p[0]}`,
            severity: 'critical',
            icon: Package,
            title: `${p[1]} is OUT OF STOCK`,
            detail: `Part code: ${p[2]} · Category: ${p[3] || 'N/A'}`,
          });
        } else if (stock < min) {
          notes.push({
            id: `part-low-${p[0]}`,
            severity: 'warning',
            icon: TrendingDown,
            title: `${p[1]} stock is LOW`,
            detail: `Current: ${stock} units · Min required: ${min}`,
          });
        }
      });

      try {
        const qRes = await getQualitySummary();
        const byLine = qRes.data.by_line || [];
        const byModel = qRes.data.by_model || [];

        byLine.forEach(r => {
          const defect = Number(r[1]);
          if (defect >= 10) {
            notes.push({
              id: `line-defect-${r[0]}`,
              severity: 'critical',
              icon: AlertTriangle,
              title: `High defect rate on ${r[0]}`,
              detail: `Avg defect: ${defect}% · ${r[2]} tests · ${r[3]} cars failed`,
            });
          } else if (defect >= 5) {
            notes.push({
              id: `line-warn-${r[0]}`,
              severity: 'warning',
              icon: AlertTriangle,
              title: `Elevated defect rate on ${r[0]}`,
              detail: `Avg defect: ${defect}% - monitor closely`,
            });
          }
        });

        byModel.forEach(r => {
          const defect = Number(r[1]);
          if (defect >= 10) {
            notes.push({
              id: `model-defect-${r[0]}`,
              severity: 'critical',
              icon: AlertTriangle,
              title: `High defect rate: ${r[0]}`,
              detail: `Avg defect: ${defect}% · ${r[3]} cars failed total`,
            });
          }
        });
      } catch {
        failures.push('quality data');
      }
    } catch {
      failures.push('parts inventory');
    }

    notes.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    setNotifications(notes);
    // Never report "all systems normal" when we simply could not reach the API
    setError(failures.length ? `Could not load ${failures.join(' and ')}. Check the backend connection.` : null);
    setLastRefreshed(new Date());
    setLoading(false);
  }, []);

  // Initial load (deferred, cancellable) plus a 60s background refresh
  useLoadOnChange(buildNotifications);
  useEffect(() => {
    const interval = setInterval(buildNotifications, 60000);
    return () => clearInterval(interval);
  }, [buildNotifications]);

  const refresh = () => {
    setLoading(true);
    buildNotifications();
  };

  const criticalCount = notifications.filter(n => n.severity === 'critical').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;
  const totalCount = notifications.length;
  const badgeCount = criticalCount || warningCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-white/8 transition"
        title="Notifications"
      >
        <Bell size={18} className="text-[rgba(243,244,244,0.72)]" />
        {badgeCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[#061E29] text-xs font-bold px-1 ${criticalCount > 0 ? 'bg-[#FF2626]' : 'bg-white'}`}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-10 w-96 auth-card z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
              <div>
                <p className="font-semibold text-[#F3F4F4] text-sm">Notifications</p>
                <p className="text-xs text-[rgba(243,244,244,0.52)] mt-0.5">
                  {totalCount === 0 ? 'All systems normal' : `${criticalCount} critical · ${warningCount} warnings`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-[rgba(243,244,244,0.52)] hover:text-[#F3F4F4] transition"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-[rgba(243,244,244,0.52)] hover:text-[#F3F4F4] transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-[rgba(255,255,255,0.06)]">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-[rgba(243,244,244,0.58)] text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Checking systems...
                </div>
              ) : error && notifications.length === 0 ? (
                <div role="alert" className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                  <AlertTriangle size={28} className="text-white" />
                  <p className="text-sm font-medium text-[#F3F4F4]">Status unavailable</p>
                  <p className="text-xs text-[rgba(243,244,244,0.52)]">{error}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CheckCircle2 size={28} className="text-[#FF2626]" />
                  <p className="text-sm font-medium text-[#F3F4F4]">All systems normal</p>
                  <p className="text-xs text-[rgba(243,244,244,0.52)]">No stock or quality issues detected</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${n.severity === 'critical' ? 'bg-[rgba(255,38,38,0.08)]' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.severity === 'critical'
                          ? 'bg-red-950/40'
                          : n.severity === 'warning'
                            ? 'bg-panel-2'
                            : 'bg-panel-2'
                      }`}>
                        <Icon
                          size={15}
                          className={
                            n.severity === 'critical'
                              ? 'text-red-600'
                              : n.severity === 'warning'
                                ? 'text-white'
                                : 'text-dim'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F3F4F4] leading-snug">{n.title}</p>
                        <p className="text-xs text-[rgba(243,244,244,0.52)] mt-0.5 leading-snug">{n.detail}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5 ${
                        n.severity === 'critical'
                          ? 'bg-red-950/40 text-red-400'
                          : n.severity === 'warning'
                            ? 'bg-panel-2 text-white'
                            : 'bg-panel-2 text-white'
                      }`}>
                        {SEV[n.severity].label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {lastRefreshed && (
              <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                <p className="text-xs text-[rgba(243,244,244,0.52)]">
                  Last checked: {lastRefreshed.toLocaleTimeString('en-IN')} · Auto-refreshes every 60s
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
