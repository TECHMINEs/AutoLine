import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { AlertTriangle, TrendingDown, Factory, Car } from 'lucide-react';
import PageHeader     from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert     from '../components/ErrorAlert';
import { getQualitySummary, getErrorMessage } from '../services/api';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

const DEFECT_THRESHOLD = 5; // % above which is considered high

const barColor = (val) => {
  if (val >= 10) return '#ef4444';
  if (val >= 5)  return '#f59e0b';
  return '#39FF14';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip p-3 text-sm">
      <p className="font-semibold text-[#F3F4F4] mb-1">{label}</p>
      <p className="text-[rgba(243,244,244,0.68)]">Avg Defect Rate: <span className="font-bold text-[#FF2626]">{d.avg_defect}%</span></p>
      <p className="text-[rgba(243,244,244,0.68)]">Tests Run: <span className="font-medium">{d.test_count}</span></p>
      <p className="text-[rgba(243,244,244,0.68)]">Total Failed: <span className="font-medium text-[#FF2626]">{d.total_failed}</span></p>
    </div>
  );
};

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getQualitySummary();
      // by_line rows:  [line_name, avg_defect, test_count, total_failed]
      // by_model rows: [model_name, avg_defect, test_count, total_failed]
      const byLine = res.data.by_line.map(r => ({
        name:         r[0],
        avg_defect:   Number(r[1]),
        test_count:   r[2],
        total_failed: r[3],
      }));
      const byModel = res.data.by_model.map(r => ({
        name:         r[0],
        avg_defect:   Number(r[1]),
        test_count:   r[2],
        total_failed: r[3],
      }));
      setData({ byLine, byModel });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnChange(fetchData);

  const highDefectLines  = data?.byLine.filter(d => d.avg_defect >= DEFECT_THRESHOLD)  || [];
  const highDefectModels = data?.byModel.filter(d => d.avg_defect >= DEFECT_THRESHOLD) || [];

  if (loading) return <LoadingSpinner text="Loading analytics…" />;
  if (error)   return <ErrorAlert message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 mt-10">
      <PageHeader
        title="Quality Analytics"
        subtitle="Defect rates broken down by production line and car model"
      />

      {/* ─── Alert Summary ─── */}
      {(highDefectLines.length > 0 || highDefectModels.length > 0) && (
        <div className="section-card p-4">
          <div className="flex items-center gap-2 text-[#FF2626] font-semibold text-sm mb-2">
            <AlertTriangle size={16} />
            High Defect Rate Detected
          </div>
          <div className="flex flex-wrap gap-2">
            {highDefectLines.map(d => (
              <span key={d.name} className="px-2 py-1 bg-[rgba(255,38,38,0.16)] text-[#FF2626] rounded-lg text-xs font-medium">
                Line: {d.name} — {d.avg_defect}%
              </span>
            ))}
            {highDefectModels.map(d => (
              <span key={d.name} className="px-2 py-1 bg-[rgba(169,169,169,0.16)] text-white rounded-lg text-xs font-medium">
                Model: {d.name} — {d.avg_defect}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* By Line */}
        <div className="section-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[rgba(255,38,38,0.16)] rounded-lg flex items-center justify-center">
              <Factory size={16} className="text-[#FF2626]" />
            </div>
            <div>
              <p className="font-semibold text-[#F3F4F4] text-sm">Defect Rate by Production Line</p>
              <p className="text-xs text-[rgba(243,244,244,0.52)]">Average defect % per line</p>
            </div>
          </div>

          {data.byLine.length === 0 ? (
            <p className="text-center text-[rgba(243,244,244,0.52)] text-sm py-10">No quality data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byLine} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'rgba(243,244,244,0.72)' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(243,244,244,0.72)' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_defect" radius={0}>
                  {data.byLine.map((d, i) => (
                    <Cell key={i} fill={barColor(d.avg_defect)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[rgba(243,244,244,0.58)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &lt; 5% (Good)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white inline-block" /> 5–10% (Moderate)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"   /> &gt; 10% (High)</span>
          </div>
        </div>

        {/* By Model */}
        <div className="section-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[rgba(255,255,255,0.16)] rounded-lg flex items-center justify-center">
              <Car size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#F3F4F4] text-sm">Defect Rate by Car Model</p>
              <p className="text-xs text-[rgba(243,244,244,0.52)]">Average defect % per model</p>
            </div>
          </div>

          {data.byModel.length === 0 ? (
            <p className="text-center text-[rgba(243,244,244,0.52)] text-sm py-10">No quality data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byModel} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'rgba(243,244,244,0.72)' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(243,244,244,0.72)' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_defect" radius={0}>
                  {data.byModel.map((d, i) => (
                    <Cell key={i} fill={barColor(d.avg_defect)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[rgba(243,244,244,0.58)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &lt; 5% (Good)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white inline-block" /> 5–10% (Moderate)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"   /> &gt; 10% (High)</span>
          </div>
        </div>
      </div>

      {/* ─── Detail Tables ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Line table */}
        <div className="table-shell">
          <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
            <p className="text-sm font-semibold text-[#F3F4F4]">Line-wise Breakdown</p>
          </div>
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-line">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Line</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Avg Defect</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.byLine.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No data.</td></tr>
              ) : data.byLine.map((d, i) => (
                <tr key={i} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.avg_defect >= 10 ? 'bg-red-950/40 text-red-400'
                      : d.avg_defect >= 5 ? 'bg-panel-2 text-white'
                      : 'bg-green-950/40 text-green-400'
                    }`}>{d.avg_defect}%</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{d.test_count}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">{d.total_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Model table */}
        <div className="table-shell">
          <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
            <p className="text-sm font-semibold text-[#F3F4F4]">Model-wise Breakdown</p>
          </div>
          <table className="w-full text-sm data-table">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-line">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Avg Defect</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.byModel.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No data.</td></tr>
              ) : data.byModel.map((d, i) => (
                <tr key={i} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.avg_defect >= 10 ? 'bg-red-950/40 text-red-400'
                      : d.avg_defect >= 5 ? 'bg-panel-2 text-white'
                      : 'bg-green-950/40 text-green-400'
                    }`}>{d.avg_defect}%</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{d.test_count}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">{d.total_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
