import { z } from 'zod';
import { transactionCoverageSchema, transactionSchema, transferPairSchema } from '@domain/schemas';
import type { TransactionFilters } from '@domain/types';
import { apiClient } from '@shared/api/client';

const transactionsSchema = z.array(transactionSchema);
const transfersSchema = z.array(transferPairSchema);

export type TransactionDto = z.infer<typeof transactionSchema>;
export type TransactionCoverageDto = z.infer<typeof transactionCoverageSchema>;
export type TransferPairDto = z.infer<typeof transferPairSchema>;

export interface UpdateTransactionRequest {
  categoryId?: number | null;
  notes?: string;
  excludeFromTotals?: boolean;
}

export interface CreateTransactionRequest {
  accountId: number;
  postedDate: string;
  transactedDate?: string;
  amount: number;
  description: string;
  payee?: string;
  memo?: string;
  categoryId?: number;
  pending?: boolean;
  excludeFromTotals?: boolean;
  notes?: string;
}

function buildAmountQueryParams(filters: TransactionFilters): { minAmount?: number; maxAmount?: number } {
  if (filters.amountOperator === undefined || filters.amountValue === undefined) {
    return {};
  }

  switch (filters.amountOperator) {
    case 'eq':
      return { minAmount: filters.amountValue, maxAmount: filters.amountValue };
    case 'gt':
      return { minAmount: filters.amountValue };
    case 'lt':
      return { maxAmount: filters.amountValue };
    default:
      return {};
  }
}

export async function getTransactions(filters: TransactionFilters) {
  const amountParams = buildAmountQueryParams(filters);

  return apiClient.request('transactions', {
    method: 'GET',
    query: {
      includeTransfers: filters.includeTransfers,
      startDate: filters.startDate,
      endDate: filters.endDate,
      descriptionQuery: filters.descriptionQuery,
      categoryId: filters.categoryId,
      uncategorized: filters.uncategorized,
      accountId: filters.accountId,
      minAmount: amountParams.minAmount,
      maxAmount: amountParams.maxAmount,
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

export async function createTransaction(request: CreateTransactionRequest) {
  return apiClient.request('transactions', {
    method: 'POST',
    body: request,
    schema: transactionSchema,
  });
}

export async function updateTransaction(id: number, request: UpdateTransactionRequest) {
  return apiClient.request(`transactions/${id}`, {
    method: 'PATCH',
    body: request,
    schema: transactionSchema,
  });
}

export async function deleteTransaction(id: number) {
  return apiClient.request(`transactions/${id}`, {
    method: 'DELETE',
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
