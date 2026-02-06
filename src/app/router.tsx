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
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/connections', element: <ConnectionsPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/budgets', element: <BudgetsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
