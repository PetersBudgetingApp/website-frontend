import { describe, expect, it } from 'vitest';
import { authSessionSchema, budgetInsightsSchema, spendingByCategorySchema, transactionSchema } from '@domain/schemas';

describe('domain schemas', () => {
  it('parses auth session payload', () => {
    const parsed = authSessionSchema.parse({
      accessToken: 'abc',
      refreshToken: 'def',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 12,
        email: 'user@example.com',
      },
    });

    expect(parsed.user.email).toBe('user@example.com');
  });

  it('rejects invalid transaction payload', () => {
    expect(() =>
      transactionSchema.parse({
        id: 1,
        accountId: 2,
        postedAt: '2026-02-06T00:00:00Z',
        amount: 'not-a-number',
      }),
    ).toThrow();
  });

  it('parses spending payload when category color is missing', () => {
    const parsed = spendingByCategorySchema.parse({
      totalSpending: 42.5,
      categories: [
        {
          categoryId: 73,
          categoryName: 'Investments',
          amount: 42.5,
          percentage: 100,
          transactionCount: 1,
        },
      ],
    });

    expect(parsed.categories[0]?.categoryColor).toBeUndefined();
  });

  it('parses budget insights payload with nullable deltas', () => {
    const parsed = budgetInsightsSchema.parse({
      month: '2026-02',
      asOfDate: '2026-02-10',
      historyMonths: 6,
      totalCurrentBudget: 850,
      totalRecommendedBudget: 900,
      categories: [
        {
          categoryId: 13,
          categoryName: 'Food',
          currentBudget: 300,
          currentMonthSpend: 140,
          averageMonthlySpend: 350,
          recommendedBudget: 350,
          budgetDelta: 50,
          budgetDeltaPct: 16.67,
          monthToDateSpend: 140,
          averageMonthToDateSpend: 120,
          monthToDateDelta: 20,
          monthToDateDeltaPct: 16.67,
        },
        {
          categoryId: 27,
          categoryName: 'Travel',
          currentBudget: 0,
          currentMonthSpend: 0,
          averageMonthlySpend: 75,
          recommendedBudget: 75,
          budgetDelta: 75,
          budgetDeltaPct: null,
          monthToDateSpend: 0,
          averageMonthToDateSpend: 0,
          monthToDateDelta: 0,
          monthToDateDeltaPct: null,
        },
      ],
    });

    expect(parsed.categories[1]?.budgetDeltaPct).toBeNull();
  });
});
