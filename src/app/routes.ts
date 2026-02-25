export const appRoutes = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  budgetInsightDetail: '/dashboard/budget-insights/:categoryId',
  accounts: '/accounts',
  transactions: '/transactions',
  categories: '/categories',
  budgets: '/budgets',
  recurring: '/recurring',
  accountDetail: '/accounts/:id',
} as const;

export function budgetInsightDetailPath(categoryId: number | string): string {
  return `/dashboard/budget-insights/${categoryId}`;
}

export interface NavigationRoute {
  path: string;
  label: string;
}

export const navigationRoutes: readonly NavigationRoute[] = [
  { path: appRoutes.dashboard, label: 'Dashboard' },
  { path: appRoutes.accounts, label: 'Accounts' },
  { path: appRoutes.transactions, label: 'Transactions' },
  { path: appRoutes.categories, label: 'Categories' },
  { path: appRoutes.budgets, label: 'Budgets' },
  { path: appRoutes.recurring, label: 'Recurring' },
];

export const defaultAuthenticatedRoute = appRoutes.dashboard;
