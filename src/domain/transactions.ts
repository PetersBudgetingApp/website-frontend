import type { TransactionFilters } from '@domain/types';

export interface BudgetEligibleTransaction {
  amount: number;
  category?: { id?: number | null } | null;
  internalTransfer: boolean;
  excludeFromTotals: boolean;
}

export function isBudgetEligibleTransaction(tx: BudgetEligibleTransaction): boolean {
  return tx.amount < 0 && !tx.internalTransfer && !tx.excludeFromTotals;
}

export function defaultTransactionFilters(): TransactionFilters {
  return {
    includeTransfers: false,
    limit: 100,
    offset: 0,
  };
}
