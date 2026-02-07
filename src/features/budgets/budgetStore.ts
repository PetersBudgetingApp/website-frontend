import type { BudgetPerformanceRow, BudgetTarget } from '@domain/types';

export function getBudgetPerformance(input: {
  categories: Array<{ id: number; name: string }>;
  targets: BudgetTarget[];
  actualByCategory: Map<number, number>;
}): BudgetPerformanceRow[] {
  const categoryNameMap = new Map(input.categories.map((item) => [item.id, item.name]));

  return input.targets.map((target) => {
    const actualAmount = input.actualByCategory.get(target.categoryId) ?? 0;
    const varianceAmount = target.targetAmount - actualAmount;
    const variancePct = target.targetAmount > 0 ? (varianceAmount / target.targetAmount) * 100 : 0;

    const status: BudgetPerformanceRow['status'] =
      Math.abs(varianceAmount) <= 0.01 ? 'on_track' : varianceAmount < 0 ? 'over' : 'under';

    return {
      categoryId: target.categoryId,
      categoryName: categoryNameMap.get(target.categoryId) ?? target.categoryName,
      targetAmount: target.targetAmount,
      actualAmount,
      varianceAmount,
      variancePct,
      status,
    };
  });
}
