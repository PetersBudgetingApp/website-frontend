import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@app/layout/RequireAuth';
import { AppShell } from '@app/layout/AppShell';
import { appRoutes, defaultAuthenticatedRoute } from '@app/routes';
import { LoginPage, RegisterPage } from '@features/auth/AuthPages';
import { DashboardPage } from '@features/dashboard/DashboardPage';
import { ConnectionsPage } from '@features/connections/ConnectionsPage';
import { TransactionsPage } from '@features/transactions/TransactionsPage';
import { CategoriesPage } from '@features/categories/CategoriesPage';
import { BudgetsPage } from '@features/budgets/BudgetsPage';
import { RecurringPage } from '@features/recurring/RecurringPage';
import { AccountDetailPage } from '@features/accounts/AccountDetailPage';

export const router = createBrowserRouter([
  {
    path: appRoutes.login,
    element: <LoginPage />,
  },
  {
    path: appRoutes.register,
    element: <RegisterPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to={defaultAuthenticatedRoute} replace /> },
          { path: appRoutes.dashboard, element: <DashboardPage /> },
          { path: appRoutes.connections, element: <ConnectionsPage /> },
          { path: appRoutes.transactions, element: <TransactionsPage /> },
          { path: appRoutes.categories, element: <CategoriesPage /> },
          { path: appRoutes.budgets, element: <BudgetsPage /> },
          { path: appRoutes.recurring, element: <RecurringPage /> },
          { path: appRoutes.accountDetail, element: <AccountDetailPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={defaultAuthenticatedRoute} replace />,
  },
]);
