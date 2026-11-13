import { useNavigate } from 'react-router-dom';
import { Users, Car, Factory } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const cards = [
  {
    to: '/settings/employees',
    label: 'Employees',
    desc: 'View and manage factory employees',
    icon: Users,
    color: 'text-dim',
    bg: 'bg-panel-2',
    border: 'border-stroke',
  },
  {
    to: '/settings/models',
    label: 'Car Models',
    desc: 'View active car models in the system',
    icon: Car,
    color: 'text-white',
    bg: 'bg-panel-2',
    border: 'border-stroke',
  },
  {
    to: '/settings/lines',
    label: 'Production Lines',
    desc: 'View active production lines',
    icon: Factory,
    color: 'text-green-600',
    bg: 'bg-green-950/40',
    border: 'border-green-500/40',
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 mt-10">
      <PageHeader
        title="Settings"
        subtitle="Manage master data — employees, models, and production lines"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(({ to, label, desc, icon: Icon, color, bg, border }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`settings-tile border ${border} p-6 text-left group w-full`}
          >
            <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center mb-4`}>
              <Icon size={22} className={color} />
            </div>
            <p className="font-semibold text-[#F3F4F4] text-base group-hover:text-[#FF2626] transition-colors">
            {label}
            </p>
            <p className="text-sm text-[rgba(243,244,244,0.58)] mt-1">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
