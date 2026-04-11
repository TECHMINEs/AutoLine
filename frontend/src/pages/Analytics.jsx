import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { AlertTriangle, TrendingDown, Factory, Car } from 'lucide-react';
import PageHeader     from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert     from '../components/ErrorAlert';
import { getQualitySummary } from '../services/api';

const DEFECT_THRESHOLD = 5; // % above which is considered high

const barColor = (val) => {
  if (val >= 10) return '#ef4444';
  if (val >= 5)  return '#f59e0b';
  return '#22c55e';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip p-3 text-sm">
      <p className="font-semibold text-[#F3F4F4] mb-1">{label}</p>
      <p className="text-[rgba(243,244,244,0.68)]">Avg Defect Rate: <span className="font-bold text-[#FFABAB]">{d.avg_defect}%</span></p>
      <p className="text-[rgba(243,244,244,0.68)]">Tests Run: <span className="font-medium">{d.test_count}</span></p>
      <p className="text-[rgba(243,244,244,0.68)]">Total Failed: <span className="font-medium text-[#FFABAB]">{d.total_failed}</span></p>
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
          <div className="flex items-center gap-2 text-[#FFABAB] font-semibold text-sm mb-2">
            <AlertTriangle size={16} />
            High Defect Rate Detected
          </div>
          <div className="flex flex-wrap gap-2">
            {highDefectLines.map(d => (
              <span key={d.name} className="px-2 py-1 bg-[rgba(244,107,107,0.16)] text-[#FFABAB] rounded-lg text-xs font-medium">
                Line: {d.name} — {d.avg_defect}%
              </span>
            ))}
            {highDefectModels.map(d => (
              <span key={d.name} className="px-2 py-1 bg-[rgba(240,187,98,0.16)] text-[#FFD796] rounded-lg text-xs font-medium">
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
            <div className="w-8 h-8 bg-[rgba(255, 0, 51,0.16)] rounded-lg flex items-center justify-center">
              <Factory size={16} className="text-[#FF0033]" />
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
                <Bar dataKey="avg_defect" radius={[4, 4, 0, 0]}>
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
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 5–10% (Moderate)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"   /> &gt; 10% (High)</span>
          </div>
        </div>

        {/* By Model */}
        <div className="section-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[rgba(156,163,255,0.16)] rounded-lg flex items-center justify-center">
              <Car size={16} className="text-[#C6CAFF]" />
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
                <Bar dataKey="avg_defect" radius={[4, 4, 0, 0]}>
                  {data.byModel.map((d, i) => (
                    <Cell key={i} fill={barColor(d.avg_defect)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[rgba(243,244,244,0.58)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &lt; 5% (Good)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 5–10% (Moderate)</span>
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
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Line</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Defect</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.byLine.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No data.</td></tr>
              ) : data.byLine.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.avg_defect >= 10 ? 'bg-red-100 text-red-700'
                      : d.avg_defect >= 5 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                    }`}>{d.avg_defect}%</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.test_count}</td>
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
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Defect</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.byModel.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No data.</td></tr>
              ) : data.byModel.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      d.avg_defect >= 10 ? 'bg-red-100 text-red-700'
                      : d.avg_defect >= 5 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                    }`}>{d.avg_defect}%</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.test_count}</td>
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
