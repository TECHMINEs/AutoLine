import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Factory, DollarSign, AlertTriangle, TrendingUp,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import PageHeader from '../components/PageHeader';
import {
  getTotalProduction, getTotalCost, getDefectRate, getProductionTrend, getErrorMessage,
} from '../services/api';
import {
  Activity,
  BarChart3,
  Boxes,
 
  ShieldCheck,
} from 'lucide-react';
import Beams from '../components/Beams';
import { useLoadOnChange } from '../hooks/useLoadOnChange';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prod, cost, defect, trend] = await Promise.all([
        getTotalProduction(),
        getTotalCost(),
        getDefectRate(),
        getProductionTrend(),
      ]);
      setStats({
        totalProduction: prod.data.total_production,
        totalCost: cost.data.total_cost,
        defectRate: defect.data.defect_rate,
        trend: trend.data,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useLoadOnChange(fetchAll);

  const chartData = stats
    ? [
        { name: 'Yesterday', units: stats.trend.yesterday },
        { name: 'Today', units: stats.trend.today },
      ]
    : [];

  const fmtCost = (v) => {
    if (!v && v !== 0) return '—';
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${Number(v).toLocaleString('en-IN')}`;
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchAll} />;

  const trendDir = stats?.trend?.direction;

  return (
    <div className="space-y-6 mt-10 align-middle" >
      <div className="hero-shell ">
        <div className="hero-grid" />
        <div className="hero-beams">
          {Array.from({ length: 12 }).map((_, idx) => <span key={idx} />)}
        </div>
        {/* <div className="relative z-10 max-w-3xl flex flex-col gap-5">
          <div className="eyebrow">Factory Intelligence</div>
          <div>
            <h1 className="text-4xl md:text-5xl text-[#F3F4F4] industrial-heading leading-tight mb-3">
              Precision Automotive Parts
            </h1>
            <p className="text-base md:text-lg text-[rgba(243,244,244,0.72)] max-w-2xl">
              Engineered for performance. Built for reliability.
            </p>
            <p className="text-sm text-[rgba(243,244,244,0.52)] mt-4 max-w-2xl">
              Real-time production, inventory, and quality signals in one industrial command center.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="action-button px-5 py-3 font-semibold">Explore Parts</button>
            <div className="secondary-button px-4 py-3 text-sm">Live factory overview</div>
          </div>
        </div> */}
        <div className='flex justify-center items-center my-auto align-middle my-auto'>
          <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0 }}>
                      <Beams
                        beamWidth={3}
                        beamHeight={30}
                        beamNumber={20}
                        lightColor="#ffffff"
                        speed={2}
                        noiseIntensity={1.75}
                        scale={0.2}
                        rotation={30}
                      />
                    </div>
        <div className='text-7xl z-20 font-bold self-center my-auto align-middle bg-gradient-to-br from-neutral-700 via-white my-auto via-neutral-200 via-white via-neutral-300 via-white via-neutral-200 via-white via-neutral-300 via-white bg-clip-text text-transparent'>
        AutoLine Systems
      </div>
        </div>

        
      </div>

      <PageHeader title="Dashboard" subtitle="Real-time factory production overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Production"
          value={Number(stats.totalProduction).toLocaleString('en-IN')}
          subtitle="All-time units produced"
          icon={Factory}
          color="blue"
        />
        <StatCard
          title="Total Parts Cost"
          value={fmtCost(stats.totalCost)}
          subtitle="Cumulative parts usage cost"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Avg Defect Rate"
          value={`${Number(stats.defectRate).toFixed(2)}%`}
          subtitle="Across all quality tests"
          icon={AlertTriangle}
          color={stats.defectRate > 5 ? 'red' : 'yellow'}
        />
        <StatCard
          title="Production Trend"
          value={`${Math.abs(Number(stats.trend.trend)).toFixed(1)}%`}
          subtitle={`Today: ${stats.trend.today} | Yesterday: ${stats.trend.yesterday}`}
          icon={TrendingUp}
          color={trendDir === 'UP' ? 'green' : 'red'}
          trend={trendDir}
        />
      </div>

      <div className="section-card p-5">
        <h2 className="font-semibold text-[rgba(243,244,244,0.78)] mb-4 text-sm uppercase tracking-[0.18em]">
          Today vs Yesterday - Units Produced
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: 'rgba(243,244,244,0.72)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(243,244,244,0.72)' }} />
            <Tooltip
              contentStyle={{
                borderRadius: 0,
                fontSize: 13,
                background: 'rgba(5,5,5,0.96)',
                border: '1px solid rgba(255,38,38,0.42)',
                color: '#F3F4F4',
              }}
              formatter={(v) => [v.toLocaleString('en-IN'), 'Units']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="units"
              stroke="#FF2626"
              strokeWidth={3}
              dot={{ r: 6, fill: '#FF2626' }}
              activeDot={{ r: 8, fill: '#F3F4F4' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card p-5">
          <p className="text-xs text-[rgba(243,244,244,0.6)] font-medium uppercase tracking-[0.18em] mb-1">Yesterday</p>
          <p className="text-3xl font-bold text-[#F3F4F4]">{Number(stats.trend.yesterday).toLocaleString('en-IN')}</p>
          <p className="text-xs text-[rgba(243,244,244,0.48)] mt-1">Units produced</p>
        </div>
        <div className="section-card p-5">
          <p className="text-xs text-[rgba(243,244,244,0.6)] font-medium uppercase tracking-[0.18em] mb-1">Today</p>
          <p className="text-3xl font-bold text-[#FF2626]">{Number(stats.trend.today).toLocaleString('en-IN')}</p>
          <p className="text-xs text-[rgba(243,244,244,0.48)] mt-1">Units produced</p>
        </div>
        <div className={`section-card p-5 ${trendDir === 'UP' ? 'border-[rgba(57,255,20,0.24)]' : 'border-[rgba(255,38,38,0.24)]'}`}>
          <p className="text-xs text-[rgba(243,244,244,0.6)] font-medium uppercase tracking-[0.18em] mb-1">Change</p>
          <p className={`text-3xl font-bold ${trendDir === 'UP' ? 'text-[#39FF14]' : 'text-[#FF2626]'}`}>
            {trendDir === 'UP' ? '+' : '-'}{Math.abs(Number(stats.trend.trend)).toFixed(2)}%
          </p>
          <p className="text-xs text-[rgba(243,244,244,0.48)] mt-1">vs previous day</p>
        </div>
      </div>
    </div>
  );
}
