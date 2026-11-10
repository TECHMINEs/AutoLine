import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Boxes,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import Beams from '../components/Beams';
import { useAuth } from '../context/auth';
import { mainNavItems, settingsNavItem } from '../components/navigation';

const featureCards = [
  {
    title: 'Inventory Tracking',
    description: 'Monitor stock movement, reorder thresholds, and warehouse visibility in one place.',
    icon: Boxes,
  },
  {
    title: 'Production Monitoring',
    description: 'Track throughput, production lines, and daily output with real-time operational views.',
    icon: Factory,
  },
  {
    title: 'Quality Assurance',
    description: 'Surface defect signals early and keep manufacturing quality standards under control.',
    icon: ShieldCheck,
  },
  {
    title: 'Analytics',
    description: 'Turn shop-floor data into trends, cost visibility, and executive-ready summaries.',
    icon: BarChart3,
  },
];

export default function Home() {
  const { can } = useAuth();

  const routeCards = [
    ...mainNavItems,
    settingsNavItem,
  ].filter(({ permission }) => !permission || can(permission));

  return (
    <div className="home-shell page-shell">
      <section className="home-hero">
        <div className="home-hero-beams">
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
        </div>

        <div className="home-hero-overlay" />

        <div className="home-hero-content">
          <span className="eyebrow">
            <Activity size={14} />
            Automotive Control Center
          </span>
          <h1 className="home-title industrial-heading">AUTOLINE</h1>
          <p className="home-subtitle">Precision Automotive Parts Management System</p>
          <p className="home-tagline">Engineered for Efficiency. Built for Performance.</p>

          <div className="home-actions">
            <NavLink to="/" className="action-button px-6 py-3 font-semibold">
              Go to Dashboard
            </NavLink>
            <NavLink to="/parts" className="secondary-button px-6 py-3 font-semibold">
              View Inventory
            </NavLink>
          </div>
        </div>
      </section>

      <section className="section-card home-route-section">
        <div className="home-route-heading">
          <span className="eyebrow">Quick Navigation</span>
          <h2 className="text-3xl font-semibold text-[#F3F4F4] mt-5">All System Modules</h2>
          <p className="text-[rgba(243,244,244,0.66)]">
            Open any section from the old sidebar directly from the homepage.
          </p>
        </div>

        <div className="home-route-grid">
          {routeCards.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="home-route-card"
            >
              <div className="home-route-icon">
                <Icon size={18} />
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="home-about section-card">
        <div className="home-about-copy">
          <span className="eyebrow">About AutoLine</span>
          <h2 className="text-3xl font-semibold text-[#F3F4F4] mt-5">About AutoLine Systems</h2>
          <p className="text-[#a0a5aa] text-[0.95rem] leading-relaxed">
            AutoLine Systems is built for modern automotive manufacturing teams that need precise visibility across parts,
            production, quality, and operational performance.
          </p>
          <p className="text-[rgba(243,244,244,0.62)] leading-7">
            From inventory tracking and production monitoring to defect analysis and analytics, the platform keeps
            factory teams aligned without changing the backend systems already powering the workflow.
          </p>
        </div>

        <div className="home-feature-grid">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="home-feature-card">
              <div className="home-feature-icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
