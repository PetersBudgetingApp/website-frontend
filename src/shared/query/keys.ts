import type { TransactionFilters } from '@domain/types';

export const queryKeys = {
  accounts: {
    all: () => ['accounts'] as const,
    summary: () => ['accounts', 'summary'] as const,
  },
  connections: {
    all: () => ['connections'] as const,
  },
  transactions: {
    all: () => ['transactions'] as const,
    list: (filters: TransactionFilters) => ['transactions', filters] as const,
    coverage: () => ['transactions', 'coverage'] as const,
    uncategorized: (startDate: string, endDate: string) => ['transactions', 'uncategorized', startDate, endDate] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    tree: () => ['categories', 'tree'] as const,
    flat: () => ['categories', 'flat'] as const,
  },
  analytics: {
    all: () => ['analytics'] as const,
    spending: (startDate?: string, endDate?: string) => ['analytics', 'spending', startDate, endDate] as const,
    cashFlow: (startDate?: string, endDate?: string) => ['analytics', 'cashflow', startDate, endDate] as const,
    trends: (months = 6) => ['analytics', 'trends', months] as const,
  },
};
