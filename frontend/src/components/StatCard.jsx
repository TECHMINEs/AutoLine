import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: { bg: 'bg-[rgba(255, 0, 51,0.14)]', icon: 'text-[#FF0033]', border: 'border-[rgba(255, 0, 51,0.22)]' },
    green: { bg: 'bg-[rgba(103,197,159,0.16)]', icon: 'text-[#9EE2C0]', border: 'border-[rgba(103,197,159,0.26)]' },
    red: { bg: 'bg-[rgba(244,107,107,0.16)]', icon: 'text-[#FFABAB]', border: 'border-[rgba(244,107,107,0.26)]' },
    yellow: { bg: 'bg-[rgba(240,187,98,0.16)]', icon: 'text-[#FFD796]', border: 'border-[rgba(240,187,98,0.24)]' },
    purple: { bg: 'bg-[rgba(156,163,255,0.16)]', icon: 'text-[#C6CAFF]', border: 'border-[rgba(156,163,255,0.24)]' },
  };

  const c = colorMap[color] || colorMap.blue;

  const trendEl = trend === 'UP'
    ? <span className="flex items-center gap-1 text-xs text-[#9EE2C0] font-medium"><TrendingUp size={12} /> UP</span>
    : trend === 'DOWN'
      ? <span className="flex items-center gap-1 text-xs text-[#FFABAB] font-medium"><TrendingDown size={12} /> DOWN</span>
      : null;

  return (
    <div className={`metric-card border ${c.border} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(243,244,244,0.7)] font-medium uppercase tracking-[0.18em]">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon size={18} className={c.icon} />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F3F4F4]">{value ?? '—'}</p>
        {(subtitle || trendEl) && (
          <div className="flex items-center gap-2 mt-1">
            {trendEl}
            {subtitle && <p className="text-xs text-[rgba(243,244,244,0.52)]">{subtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
