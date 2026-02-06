const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency = 'USD'): string {
  const key = `${currency}-en-US`;
  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  }
  return currencyFormatterCache.get(key)!.format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(input?: string | null): string {
  if (!input) {
    return 'N/A';
  }
  return new Date(input).toLocaleDateString();
}

export function formatMonth(input: string): string {
  const [year, month] = input.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function getCurrentMonthKey(now = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}
