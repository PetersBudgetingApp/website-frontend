export const appRoutes = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  connections: '/connections',
  transactions: '/transactions',
  categories: '/categories',
  budgets: '/budgets',
  recurring: '/recurring',
  accountDetail: '/accounts/:id',
} as const;

export interface NavigationRoute {
  path: string;
  label: string;
}

export const navigationRoutes: readonly NavigationRoute[] = [
  { path: appRoutes.dashboard, label: 'Dashboard' },
  { path: appRoutes.connections, label: 'Connections' },
  { path: appRoutes.transactions, label: 'Transactions' },
  { path: appRoutes.categories, label: 'Categories' },
  { path: appRoutes.budgets, label: 'Budgets' },
  { path: appRoutes.recurring, label: 'Recurring' },
];

export const defaultAuthenticatedRoute = appRoutes.dashboard;
