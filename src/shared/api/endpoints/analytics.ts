import { z } from 'zod';
import { budgetInsightsSchema, cashFlowSchema, spendingByCategorySchema, trendSchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

export type SpendingDto = z.infer<typeof spendingByCategorySchema>;
export type TrendDto = z.infer<typeof trendSchema>;
export type CashFlowDto = z.infer<typeof cashFlowSchema>;
export type BudgetInsightsDto = z.infer<typeof budgetInsightsSchema>;

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

export async function getBudgetInsights(month?: string, historyMonths = 6) {
  return apiClient.request('analytics/budget-insights', {
    query: { month, historyMonths },
    schema: budgetInsightsSchema,
  });
}
