import { LogOut } from 'lucide-react';
import { useAuth } from '../context/auth';
import RoleBadge from './RoleBadge';
import NotificationPanel from './NotificationPanel';

export default function Topbar() {
  const { user, logout } = useAuth();

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="h-16 topbar-shell flex items-center justify-between px-6 flex-shrink-0">
      <p className="text-sm text-[rgba(243,244,244,0.68)] tracking-[0.12em] uppercase">{now}</p>

      <div className="flex items-center gap-3">
        <NotificationPanel />
        <RoleBadge />
        <div className="text-sm font-medium text-[#F3F4F4]">
          {user?.displayName || user?.username || 'User'}
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="secondary-button flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}
