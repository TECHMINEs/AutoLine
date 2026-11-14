import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Factory,
  LogOut,
  Menu,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/auth';
import NotificationPanel from './NotificationPanel';
import RoleBadge from './RoleBadge';
import { mainNavItems, settingsNavItem } from './navigation';

function NavItems({ onNavigate }) {
  const { can } = useAuth();
  const allNavItems = [...mainNavItems, settingsNavItem];

  return allNavItems.map(({ to, label, permission }) => {
    if (permission && !can(permission)) return null;

    return (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        onClick={onNavigate}
        className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
      >
        {label}
      </NavLink>
    );
  });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation (state adjusted during render, not in an effect)
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenuOpen(false);
  }

  return (
    <header className={`navbar-shell ${scrolled ? 'navbar-shell-solid' : ''}`}>
      <div className="navbar-inner">
        <NavLink to="/home" className="navbar-brand">
          <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="AutoLine logo" width={42} height={42} className="navbar-brand-mark" />
          <span>
            <span className="navbar-brand-title text-white">Auto<span className="text-[#FF2626]">Line</span></span>
            <span className="navbar-brand-subtitle">By TECHMINES</span>
          </span>
        </NavLink>

        <nav className="navbar-links">
          <NavItems />
        </nav>

        <div className="navbar-actions">
          <NotificationPanel />

          <div className="navbar-user">
            <div className="navbar-user-copy">
              <span className="navbar-user-name">{user?.displayName || user?.username || 'User'}</span>
              <RoleBadge />
            </div>
            <UserCircle2 size={18} className="text-[rgba(243,244,244,0.72)]" />
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="secondary-button flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <LogOut size={14} />
            Sign out
          </button>

          <button
            type="button"
            className="icon-button navbar-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-panel">
          <NavItems onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
