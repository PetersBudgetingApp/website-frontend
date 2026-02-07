export function isBudgetEligibleTransaction(tx) {
    return tx.amount < 0 && !tx.internalTransfer && !tx.excludeFromTotals;
}
export function defaultTransactionFilters() {
    return {
        includeTransfers: false,
        limit: 100,
        offset: 0,
    };
}
export function toMonthDateRange(month) {
    const [year, monthIndex] = month.split('-').map(Number);
    const start = new Date(year, monthIndex - 1, 1);
    const end = new Date(year, monthIndex, 0);
    const toIso = (date) => {
        const monthPart = `${date.getMonth() + 1}`.padStart(2, '0');
        const dayPart = `${date.getDate()}`.padStart(2, '0');
        return `${date.getFullYear()}-${monthPart}-${dayPart}`;
    };
    return {
        startDate: toIso(start),
        endDate: toIso(end),
    };
}
