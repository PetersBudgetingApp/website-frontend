export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'LOAN' | 'INVESTMENT' | 'OTHER';

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
  errors?: Record<string, string>;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface BudgetTarget {
  categoryId: number;
  categoryName: string;
  targetAmount: number;
  notes?: string;
}

export interface BudgetMonth {
  month: string;
  currency: string;
  targets: BudgetTarget[];
}

export interface BudgetPerformanceRow {
  categoryId: number;
  categoryName: string;
  targetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePct: number;
  status: 'under' | 'over' | 'on_track';
}

export interface TransactionFilters {
  includeTransfers: boolean;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  accountId?: number;
  limit: number;
  offset: number;
}

export interface AppUserState {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: AuthUser | null;
}
