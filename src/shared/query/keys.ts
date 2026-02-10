import type { TransactionFilters } from '@domain/types';

export const queryKeys = {
  accounts: {
    all: () => ['accounts'] as const,
    detail: (id: number) => ['accounts', id] as const,
    summary: () => ['accounts', 'summary'] as const,
  },
  connections: {
    all: () => ['connections'] as const,
  },
  transactions: {
    all: () => ['transactions'] as const,
    list: (filters: TransactionFilters) => ['transactions', filters] as const,
    coverage: () => ['transactions', 'coverage'] as const,
    transfers: () => ['transactions', 'transfers'] as const,
    uncategorized: (startDate: string, endDate: string) => ['transactions', 'uncategorized', startDate, endDate] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    tree: () => ['categories', 'tree'] as const,
    flat: () => ['categories', 'flat'] as const,
    rules: () => ['categories', 'rules'] as const,
    ruleTransactions: (ruleId: number) => ['categories', 'rules', ruleId, 'transactions'] as const,
  },
  analytics: {
    all: () => ['analytics'] as const,
    spending: (startDate?: string, endDate?: string) => ['analytics', 'spending', startDate, endDate] as const,
    cashFlow: (startDate?: string, endDate?: string) => ['analytics', 'cashflow', startDate, endDate] as const,
    trends: (months = 6) => ['analytics', 'trends', months] as const,
    budgetInsights: (month: string, historyMonths = 6) => ['analytics', 'budget-insights', month, historyMonths] as const,
    budgetInsightTransactions: (categoryId: number) => ['analytics', 'budget-insights', 'transactions', categoryId] as const,
  },
  budgets: {
    all: () => ['budgets'] as const,
    month: (month: string) => ['budgets', month] as const,
  },
  recurring: {
    all: () => ['recurring'] as const,
    upcoming: () => ['recurring', 'upcoming'] as const,
    calendar: (month: string) => ['recurring', 'calendar', month] as const,
  },
};
