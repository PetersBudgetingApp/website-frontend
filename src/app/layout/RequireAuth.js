import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@shared/hooks/useAuth';
export function RequireAuth() {
    const auth = useAuth();
    const location = useLocation();
    if (auth.status === 'loading') {
        return (_jsx("main", { className: "page center-page", children: _jsx("p", { children: "Restoring session..." }) }));
    }
    if (auth.status !== 'authenticated') {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    return _jsx(Outlet, {});
}
