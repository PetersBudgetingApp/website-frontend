import { z } from 'zod';
import {
  accountSchema,
  accountSummarySchema,
  cashFlowSchema,
  categorySchema,
  connectionSchema,
  spendingByCategorySchema,
  transactionCoverageSchema,
  syncResultSchema,
  transactionSchema,
  transferPairSchema,
  trendSchema,
} from '@domain/schemas';
import type { TransactionFilters } from '@domain/types';
import { apiClient } from '@shared/api/client';

const categoriesSchema = z.array(categorySchema);
const accountsSchema = z.array(accountSchema);
const connectionsSchema = z.array(connectionSchema);
const transactionsSchema = z.array(transactionSchema);
const transfersSchema = z.array(transferPairSchema);

export type AccountDto = z.infer<typeof accountSchema>;
export type AccountSummaryDto = z.infer<typeof accountSummarySchema>;
export type CategoryDto = z.infer<typeof categorySchema>;
export type ConnectionDto = z.infer<typeof connectionSchema>;
export type TransactionDto = z.infer<typeof transactionSchema>;
export type TransactionCoverageDto = z.infer<typeof transactionCoverageSchema>;
export type TransferPairDto = z.infer<typeof transferPairSchema>;
export type SpendingDto = z.infer<typeof spendingByCategorySchema>;
export type TrendDto = z.infer<typeof trendSchema>;
export type CashFlowDto = z.infer<typeof cashFlowSchema>;

export async function getAccounts() {
  return apiClient.request('accounts', {
    schema: accountsSchema,
  });
}

export async function getAccountSummary() {
  return apiClient.request('accounts/summary', {
    schema: accountSummarySchema,
  });
}

export async function getConnections() {
  return apiClient.request('connections', {
    schema: connectionsSchema,
  });
}

export async function setupSimpleFinConnection(setupToken: string) {
  return apiClient.request('connections/simplefin/setup', {
    method: 'POST',
    body: { setupToken },
    schema: connectionSchema,
  });
}

export async function syncConnection(id: number) {
  return apiClient.request(`connections/${id}/sync`, {
    method: 'POST',
    schema: syncResultSchema,
  });
}

export async function deleteConnection(id: number) {
  return apiClient.request<void>(`connections/${id}`, {
    method: 'DELETE',
  });
}

export async function getTransactions(filters: TransactionFilters) {
  return apiClient.request('transactions', {
    method: 'GET',
    query: {
      includeTransfers: filters.includeTransfers,
      startDate: filters.startDate,
      endDate: filters.endDate,
      categoryId: filters.categoryId,
      accountId: filters.accountId,
      limit: filters.limit,
      offset: filters.offset,
    },
    schema: transactionsSchema,
  });
}

export async function getTransactionCoverage() {
  return apiClient.request('transactions/coverage', {
    method: 'GET',
    schema: transactionCoverageSchema,
  });
}

export async function updateTransaction(
  id: number,
  request: {
    categoryId?: number;
    notes?: string;
    excludeFromTotals?: boolean;
  },
) {
  return apiClient.request(`transactions/${id}`, {
    method: 'PATCH',
    body: request,
    schema: transactionSchema,
  });
}

export async function getTransfers() {
  return apiClient.request('transactions/transfers', {
    schema: transfersSchema,
  });
}

export async function markTransfer(id: number, pairTransactionId: number) {
  return apiClient.request(`transactions/${id}/mark-as-transfer`, {
    method: 'POST',
    body: { pairTransactionId },
  });
}

export async function unlinkTransfer(id: number) {
  return apiClient.request(`transactions/${id}/unlink-transfer`, {
    method: 'POST',
  });
}

export async function getCategories(flat = false) {
  return apiClient.request('categories', {
    query: { flat },
    schema: categoriesSchema,
  });
}

export async function createCategory(input: {
  parentId: number | null;
  name: string;
  icon?: string;
  color?: string;
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}) {
  return apiClient.request('categories', {
    method: 'POST',
    body: input,
    schema: categorySchema,
  });
}

export async function updateCategory(
  id: number,
  input: {
    parentId: number | null;
    name: string;
    icon?: string;
    color?: string;
    categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  },
) {
  return apiClient.request(`categories/${id}`, {
    method: 'PUT',
    body: input,
    schema: categorySchema,
  });
}

export async function deleteCategory(id: number) {
  return apiClient.request<void>(`categories/${id}`, {
    method: 'DELETE',
  });
}

export async function getSpendingByCategory(startDate?: string, endDate?: string) {
  return apiClient.request('analytics/spending', {
    query: { startDate, endDate },
    schema: spendingByCategorySchema,
  });
}

export async function getTrends(months = 6) {
  return apiClient.request('analytics/trends', {
    query: { months },
    schema: trendSchema,
  });
}

export async function getCashFlow(startDate?: string, endDate?: string) {
  return apiClient.request('analytics/cashflow', {
    query: { startDate, endDate },
    schema: cashFlowSchema,
  });
}
