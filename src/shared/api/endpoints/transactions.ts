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

export async function getTransactions(filters: TransactionFilters) {
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

export async function updateTransaction(id: number, request: UpdateTransactionRequest) {
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
