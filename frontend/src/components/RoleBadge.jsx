import { useAuth, ROLES } from '../context/AuthContext';
import { ShieldCheck, Briefcase, HardHat } from 'lucide-react';

const CONFIG = {
  [ROLES.ADMIN]: { label: 'Admin', icon: ShieldCheck, cls: 'bg-[rgba(255, 0, 51,0.2)] text-[#FF0033] border border-[rgba(255, 0, 51,0.22)]' },
  [ROLES.MANAGER]: { label: 'Manager', icon: Briefcase, cls: 'bg-[rgba(156,163,255,0.16)] text-[#C6CAFF] border border-[rgba(156,163,255,0.22)]' },
  [ROLES.OPERATOR]: { label: 'Operator', icon: HardHat, cls: 'bg-[rgba(240,187,98,0.16)] text-[#FFD796] border border-[rgba(240,187,98,0.22)]' },
};

export default function RoleBadge() {
  const { user } = useAuth();
  if (!user) return null;

  const { label, icon: Icon, cls } = CONFIG[user.role] || CONFIG[ROLES.OPERATOR];

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
