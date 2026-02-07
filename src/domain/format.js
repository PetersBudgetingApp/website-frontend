const currencyFormatterCache = new Map();
export function formatCurrency(amount, currency = 'USD') {
    const key = `${currency}-en-US`;
    if (!currencyFormatterCache.has(key)) {
        currencyFormatterCache.set(key, new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }));
    }
    return currencyFormatterCache.get(key).format(amount);
}
export function formatPercent(value) {
    return `${value.toFixed(1)}%`;
}
export function formatDate(input) {
    if (!input) {
        return 'N/A';
    }
    return new Date(input).toLocaleDateString();
}
export function formatMonth(input) {
    const [year, month] = input.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}
export function getCurrentMonthKey(now = new Date()) {
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
}
