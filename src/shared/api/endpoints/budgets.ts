import { z } from 'zod';
import { budgetMonthSchema } from '@domain/schemas';
import type { BudgetTarget } from '@domain/types';
import { apiClient } from '@shared/api/client';

export type BudgetMonthDto = z.infer<typeof budgetMonthSchema>;

export async function getBudgetMonth(month: string) {
  return apiClient.request('budgets', {
    query: { month },
    schema: budgetMonthSchema,
  });
}

export async function upsertBudgetMonth(month: string, targets: BudgetTarget[]) {
  return apiClient.request(`budgets/${month}`, {
    method: 'PUT',
    body: {
      targets: targets.map((target) => ({
        categoryId: target.categoryId,
        targetAmount: target.targetAmount,
        notes: target.notes?.trim() || undefined,
      })),
    },
    schema: budgetMonthSchema,
  });
}

export async function deleteBudgetTarget(month: string, categoryId: number) {
  return apiClient.request<void>(`budgets/${month}/categories/${categoryId}`, {
    method: 'DELETE',
  });
}
