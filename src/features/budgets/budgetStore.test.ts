import { beforeEach, describe, expect, it } from 'vitest';
import { LocalBudgetStoreAdapter } from '@features/budgets/budgetStore';

describe('LocalBudgetStoreAdapter', () => {
  const adapter = new LocalBudgetStoreAdapter();

  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and loads monthly targets', () => {
    adapter.saveMonthTargets(1, '2026-02', [
      { categoryId: 10, categoryName: 'Food', targetAmount: 500, notes: 'Groceries + dining' },
    ]);

    const targets = adapter.getMonthTargets(1, '2026-02');
    expect(targets).toHaveLength(1);
    expect(targets[0]?.targetAmount).toBe(500);
  });

  it('computes performance rows from target and actual values', () => {
    const performance = adapter.getPerformance({
      categories: [{ id: 10, name: 'Food' }],
      targets: [{ categoryId: 10, categoryName: 'Food', targetAmount: 400 }],
      actualByCategory: new Map([[10, 460]]),
    });

    expect(performance[0]?.status).toBe('over');
    expect(performance[0]?.varianceAmount).toBe(-60);
  });
});
