import { NavLink } from 'react-router-dom';
import {
  Factory, Settings, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/auth';
import { mainNavItems, settingsNavItem } from './navigation';

export default function Sidebar() {
  const { can } = useAuth();

  return (
    <aside className="h-full flex flex-col sidebar-shell text-white w-64 shadow-xl">
      <div className="flex flex-col items-center gap-3 px-5 py-5 border-b border-[rgba(255,255,255,0.08)]">
        <div className="w-9 h-9 rounded-lg bg-[#FF0000] flex items-center justify-center flex-shrink-0 shadow-[0_10px_20px_rgba(255, 0, 0,0.24)]">
          <Factory size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight industrial-heading tracking-[0.16em]">AutoLine</p>
          <p className="text-xs text-[rgba(243,244,244,0.52)] leading-tight">Management System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map(({ to, label, icon: Icon, permission }) => {
          if (permission && !can(permission)) return null;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive ? 'nav-link-active' : 'nav-link-idle'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-[#061E29]' : 'text-[rgba(243,244,244,0.42)] group-hover:text-white'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {can(settingsNavItem.permission) && (
        <div className="px-3 pb-4 border-t border-[rgba(255,255,255,0.08)] pt-3">
          <NavLink
            to={settingsNavItem.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive ? 'nav-link-active' : 'nav-link-idle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings size={18} className={isActive ? 'text-[#061E29]' : 'text-[rgba(243,244,244,0.42)] group-hover:text-white'} />
                <span className="flex-1">{settingsNavItem.label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        </div>
      )}

      <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.08)]">
        <p className="text-xs text-[rgba(243,244,244,0.42)]">v1.0.0 · Oracle DB</p>
      </div>
    </aside>
  );
}
