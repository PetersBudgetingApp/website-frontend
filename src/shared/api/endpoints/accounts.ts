import { z } from 'zod';
import type { NetWorthCategory } from '@domain/types';
import { accountDeletionPreviewSchema, accountSchema, accountSummarySchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const accountsSchema = z.array(accountSchema);

export type AccountDto = z.infer<typeof accountSchema>;
export type AccountSummaryDto = z.infer<typeof accountSummarySchema>;
export type AccountDeletionPreviewDto = z.infer<typeof accountDeletionPreviewSchema>;
export interface AccountCreateRequestDto {
  name: string;
  institutionName?: string;
  netWorthCategory: NetWorthCategory;
  currentBalance: number;
  currency?: string;
}

export async function getAccounts() {
  return apiClient.request('accounts', {
    schema: accountsSchema,
  });
}

export async function getAccount(id: number) {
  return apiClient.request(`accounts/${id}`, {
    schema: accountSchema,
  });
}

export async function getAccountSummary() {
  return apiClient.request('accounts/summary', {
    schema: accountSummarySchema,
  });
}

export async function createAccount(payload: AccountCreateRequestDto) {
  return apiClient.request('accounts', {
    method: 'POST',
    body: payload,
    schema: accountSchema,
  });
}

export async function getAccountDeletionPreview(id: number) {
  return apiClient.request(`accounts/${id}/deletion-preview`, {
    schema: accountDeletionPreviewSchema,
  });
}

export async function deleteAccount(id: number) {
  return apiClient.request<void>(`accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAccountNetWorthCategory(id: number, netWorthCategory: NetWorthCategory) {
  return apiClient.request(`accounts/${id}/net-worth-category`, {
    method: 'PATCH',
    body: { netWorthCategory },
    schema: accountSchema,
  });
}
