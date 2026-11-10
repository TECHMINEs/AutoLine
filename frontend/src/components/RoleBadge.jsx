import { useAuth, ROLES } from '../context/auth';
import { ShieldCheck, Briefcase, HardHat } from 'lucide-react';

const CONFIG = {
  [ROLES.ADMIN]: { label: 'Admin', icon: ShieldCheck, cls: 'bg-[rgba(255, 0, 0,0.2)] text-[#FF0000] border border-[rgba(255, 0, 0,0.22)]' },
  [ROLES.MANAGER]: { label: 'Manager', icon: Briefcase, cls: 'bg-[rgba(0,255,255,0.16)] text-[#00FFFF] border border-[rgba(0,255,255,0.22)]' },
  [ROLES.OPERATOR]: { label: 'Operator', icon: HardHat, cls: 'bg-[rgba(255,95,31,0.16)] text-[#FF5F1F] border border-[rgba(255,95,31,0.22)]' },
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
