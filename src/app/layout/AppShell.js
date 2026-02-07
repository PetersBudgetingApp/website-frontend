import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "app-sidebar", children: [_jsxs("div", { className: "brand", children: [_jsx("h1", { children: "LedgerFlow" }), _jsx("p", { children: "Personal budgeting" })] }), _jsx("nav", { className: "nav-links", "aria-label": "Primary", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link'), children: item.label }, item.to))) })] }), _jsxs("div", { className: "app-content", children: [_jsxs("header", { className: "app-header", children: [_jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Signed in as" }), _jsx("strong", { children: auth.user?.email })] }), _jsx(Button, { variant: "ghost", onClick: () => logout(), children: "Logout" })] }), _jsx("main", { className: "page-content", children: _jsx(Outlet, {}) })] }), _jsx("nav", { className: "mobile-nav", "aria-label": "Mobile Navigation", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link'), children: item.label }, item.to))) })] }));
}
