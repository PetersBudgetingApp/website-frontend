import { describe, expect, it } from 'vitest';
import { getBudgetPerformance } from '@features/budgets/budgetStore';

describe('getBudgetPerformance', () => {
  it('computes performance rows from target and actual values', () => {
    const performance = getBudgetPerformance({
      categories: [{ id: 10, name: 'Food' }],
      targets: [{ categoryId: 10, categoryName: 'Food', targetAmount: 400 }],
      actualByCategory: new Map([[10, 460]]),
    });

    expect(performance[0]?.status).toBe('over');
    expect(performance[0]?.varianceAmount).toBe(-60);
  });
});
