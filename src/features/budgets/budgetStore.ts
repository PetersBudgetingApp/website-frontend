import type { BudgetPerformanceRow, BudgetTarget } from '@domain/types';

export interface BudgetStoreAdapter {
  getMonthTargets(userId: number, month: string): BudgetTarget[];
  saveMonthTargets(userId: number, month: string, targets: BudgetTarget[]): void;
  deleteTarget(userId: number, month: string, categoryId: number): void;
  getPerformance(input: {
    categories: Array<{ id: number; name: string }>;
    targets: BudgetTarget[];
    actualByCategory: Map<number, number>;
  }): BudgetPerformanceRow[];
}

const STORAGE_VERSION = 'v1';
const STORAGE_PREFIX = `budget.targets.${STORAGE_VERSION}`;

function getStorageKey(userId: number, month: string) {
  return `${STORAGE_PREFIX}.${userId}.${month}`;
}

export class LocalBudgetStoreAdapter implements BudgetStoreAdapter {
  getMonthTargets(userId: number, month: string): BudgetTarget[] {
    const key = getStorageKey(userId, month);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BudgetTarget[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveMonthTargets(userId: number, month: string, targets: BudgetTarget[]): void {
    const key = getStorageKey(userId, month);
    localStorage.setItem(key, JSON.stringify(targets));
  }

  deleteTarget(userId: number, month: string, categoryId: number): void {
    const nextTargets = this.getMonthTargets(userId, month).filter((item) => item.categoryId !== categoryId);
    this.saveMonthTargets(userId, month, nextTargets);
  }

  getPerformance(input: {
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
}

export const localBudgetStore = new LocalBudgetStoreAdapter();
