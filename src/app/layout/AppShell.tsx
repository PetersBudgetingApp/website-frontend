import { NavLink, Outlet } from 'react-router-dom';
import { logout } from '@shared/auth/authApi';
import { useAuth } from '@shared/hooks/useAuth';
import { Button } from '@shared/ui/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/connections', label: 'Connections' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/categories', label: 'Categories' },
  { to: '/budgets', label: 'Budgets' },
];

export function AppShell() {
  const auth = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <h1>LedgerFlow</h1>
          <p>Personal budgeting</p>
        </div>
        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="subtle">Signed in as</p>
            <strong>{auth.user?.email}</strong>
          </div>
          <Button variant="ghost" onClick={() => logout()}>
            Logout
          </Button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
