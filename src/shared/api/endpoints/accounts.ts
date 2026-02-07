import { z } from 'zod';
import { accountSchema, accountSummarySchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const accountsSchema = z.array(accountSchema);

export type AccountDto = z.infer<typeof accountSchema>;
export type AccountSummaryDto = z.infer<typeof accountSummarySchema>;

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
