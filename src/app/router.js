import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@app/layout/RequireAuth';
import { AppShell } from '@app/layout/AppShell';
import { LoginPage, RegisterPage } from '@features/auth/AuthPages';
import { DashboardPage } from '@features/dashboard/DashboardPage';
import { ConnectionsPage } from '@features/connections/ConnectionsPage';
import { TransactionsPage } from '@features/transactions/TransactionsPage';
import { CategoriesPage } from '@features/categories/CategoriesPage';
import { BudgetsPage } from '@features/budgets/BudgetsPage';
export const router = createBrowserRouter([
    {
        path: '/login',
        element: _jsx(LoginPage, {}),
    },
    {
        path: '/register',
        element: _jsx(RegisterPage, {}),
    },
    {
        element: _jsx(RequireAuth, {}),
        children: [
            {
                element: _jsx(AppShell, {}),
                children: [
                    { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) },
                    { path: '/dashboard', element: _jsx(DashboardPage, {}) },
                    { path: '/connections', element: _jsx(ConnectionsPage, {}) },
                    { path: '/transactions', element: _jsx(TransactionsPage, {}) },
                    { path: '/categories', element: _jsx(CategoriesPage, {}) },
                    { path: '/budgets', element: _jsx(BudgetsPage, {}) },
                ],
            },
        ],
    },
    {
        path: '*',
        element: _jsx(Navigate, { to: "/dashboard", replace: true }),
    },
]);
