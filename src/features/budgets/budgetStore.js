const STORAGE_VERSION = 'v1';
const STORAGE_PREFIX = `budget.targets.${STORAGE_VERSION}`;
function getStorageKey(userId, month) {
    return `${STORAGE_PREFIX}.${userId}.${month}`;
}
export class LocalBudgetStoreAdapter {
    getMonthTargets(userId, month) {
        const key = getStorageKey(userId, month);
        const raw = localStorage.getItem(key);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    saveMonthTargets(userId, month, targets) {
        const key = getStorageKey(userId, month);
        localStorage.setItem(key, JSON.stringify(targets));
    }
    deleteTarget(userId, month, categoryId) {
        const nextTargets = this.getMonthTargets(userId, month).filter((item) => item.categoryId !== categoryId);
        this.saveMonthTargets(userId, month, nextTargets);
    }
    getPerformance(input) {
        const categoryNameMap = new Map(input.categories.map((item) => [item.id, item.name]));
        return input.targets.map((target) => {
            const actualAmount = input.actualByCategory.get(target.categoryId) ?? 0;
            const varianceAmount = target.targetAmount - actualAmount;
            const variancePct = target.targetAmount > 0 ? (varianceAmount / target.targetAmount) * 100 : 0;
            const status = Math.abs(varianceAmount) <= 0.01 ? 'on_track' : varianceAmount < 0 ? 'over' : 'under';
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
