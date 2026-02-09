import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { navigationRoutes } from '@app/routes';
import { logout } from '@shared/auth/authApi';
import { useAuth } from '@shared/hooks/useAuth';
import { Button } from '@shared/ui/Button';

function getPageTitle(pathname: string): string {
  const navMatch = navigationRoutes.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (navMatch) {
    return navMatch.label;
  }

  if (pathname.startsWith('/accounts/')) {
    return 'Account Details';
  }

  return 'Velum';
}

export function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 860) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <h1>Velum</h1>
          <p>Personal budgeting</p>
        </div>
        <nav className="nav-links" aria-label="Primary">
          {navigationRoutes.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div className="app-header-main">
            <p className="subtle app-header-user-label">Signed in as</p>
            <strong className="app-header-user-email">{auth.user?.email}</strong>
            <h2 className="app-header-mobile-title">{pageTitle}</h2>
          </div>
          <div className="app-header-actions">
            <Button
              type="button"
              variant="ghost"
              className="mobile-menu-toggle"
              aria-controls="mobile-navigation-drawer"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <span className="mobile-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="mobile-menu-toggle-label">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
            </Button>
            <Button variant="ghost" className="desktop-logout-btn" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        className={isMobileMenuOpen ? 'mobile-menu-backdrop open' : 'mobile-menu-backdrop'}
        aria-hidden={!isMobileMenuOpen}
        aria-label="Close navigation menu"
        tabIndex={isMobileMenuOpen ? 0 : -1}
        disabled={!isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        id="mobile-navigation-drawer"
        className={isMobileMenuOpen ? 'mobile-menu-drawer open' : 'mobile-menu-drawer'}
        aria-label="Mobile Navigation"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-menu-drawer-header">
          <p>Navigation</p>
          <Button type="button" variant="ghost" className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
            Close
          </Button>
        </div>
        <nav className="mobile-menu-links" aria-label="Mobile Navigation Links">
          {navigationRoutes.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'mobile-menu-link active' : 'mobile-menu-link')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mobile-menu-footer">
          <p className="subtle">Signed in as</p>
          <p className="mobile-menu-email">{auth.user?.email}</p>
          <Button
            type="button"
            variant="ghost"
            className="mobile-menu-logout"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
          >
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}
