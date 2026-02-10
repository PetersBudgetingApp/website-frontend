import type { TransactionDto } from '@shared/api/endpoints/transactions';

export interface MonthlySpendPoint {
  month: string;
  label: string;
  amount: number;
}

export interface MerchantInsightRow {
  merchantName: string;
  currentMonthTransactionCount: number;
  currentMonthSpend: number;
  averageTransactionCountPerMonth: number;
  averageSpendPerMonth: number;
}

export interface MerchantInsightResult {
  rows: MerchantInsightRow[];
  effectiveAverageMonths: number;
}

export type MerchantSortColumn =
  | 'merchantName'
  | 'currentMonthTransactionCount'
  | 'currentMonthSpend'
  | 'averageTransactionCountPerMonth'
  | 'averageSpendPerMonth';

export type SortDirection = 'asc' | 'desc';

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: '2-digit',
});

const monthKeyPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function normalizeMonthKey(value: string | null | undefined, fallbackMonthKey: string): string {
  if (!value) {
    return fallbackMonthKey;
  }
  return monthKeyPattern.test(value) ? value : fallbackMonthKey;
}

export function shiftMonthKey(monthKey: string, monthsDelta: number): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }

  const shifted = new Date(Date.UTC(year, month - 1 + monthsDelta, 1));
  const normalizedMonth = `${shifted.getUTCMonth() + 1}`.padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${normalizedMonth}`;
}

export function buildMonthRangeEndingAt(monthKey: string, months: number, earliestMonthKey?: string | null): string[] {
  if (months <= 0) {
    return [];
  }

  const endMonthIndex = toMonthIndex(monthKey);
  if (endMonthIndex === null) {
    return [];
  }

  let startMonthIndex = endMonthIndex - (months - 1);
  if (earliestMonthKey) {
    const earliestMonthIndex = toMonthIndex(earliestMonthKey);
    if (earliestMonthIndex !== null) {
      startMonthIndex = Math.max(startMonthIndex, earliestMonthIndex);
    }
  }

  if (startMonthIndex > endMonthIndex) {
    return [];
  }

  return Array.from(
    { length: endMonthIndex - startMonthIndex + 1 },
    (_, index) => toMonthKeyFromIndex(startMonthIndex + index),
  );
}

export function toMonthKeyFromIsoDate(dateValue?: string | null): string | null {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0');
  return `${parsed.getUTCFullYear()}-${month}`;
}

export function toMonthLabel(monthKey: string): string {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }

  return monthLabelFormatter.format(new Date(year, month - 1, 1));
}

export function toMerchantName(transaction: TransactionDto): string {
  const merchant = [transaction.payee, transaction.description, transaction.memo].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
  return merchant?.trim() ?? 'Unknown Merchant';
}

export function toEligibleExpenseTransactions(transactions: TransactionDto[]): TransactionDto[] {
  return transactions.filter((transaction) => (
    transaction.amount < 0 &&
    !transaction.excludeFromTotals &&
    !transaction.internalTransfer
  ));
}

export function findEarliestTransactionMonthKey(transactions: TransactionDto[]): string | null {
  let earliestIndex: number | null = null;

  for (const transaction of transactions) {
    const monthKey = toMonthKeyFromIsoDate(transaction.postedAt);
    if (!monthKey) {
      continue;
    }
    const monthIndex = toMonthIndex(monthKey);
    if (monthIndex === null) {
      continue;
    }

    if (earliestIndex === null || monthIndex < earliestIndex) {
      earliestIndex = monthIndex;
    }
  }

  return earliestIndex === null ? null : toMonthKeyFromIndex(earliestIndex);
}

export function laterMonthKey(first: string | null | undefined, second: string | null | undefined): string | null {
  const firstIndex = first ? toMonthIndex(first) : null;
  const secondIndex = second ? toMonthIndex(second) : null;

  if (firstIndex === null && secondIndex === null) {
    return null;
  }
  if (firstIndex === null) {
    return second ?? null;
  }
  if (secondIndex === null) {
    return first ?? null;
  }

  return firstIndex >= secondIndex ? (first ?? null) : (second ?? null);
}

export function buildHistoricalAverageWindowMonths(
  monthKey: string,
  averageMonths: number,
  earliestMonthKey?: string | null,
): string[] {
  return buildMonthRangeEndingAt(shiftMonthKey(monthKey, -1), averageMonths, earliestMonthKey);
}

export function buildMonthlySpendSeries(
  transactions: TransactionDto[],
  monthKey: string,
  historyMonths: number,
  earliestMonthKey?: string | null,
): MonthlySpendPoint[] {
  const monthKeys = buildMonthRangeEndingAt(monthKey, historyMonths, earliestMonthKey);
  const totalsByMonth = new Map<string, number>();
  monthKeys.forEach((key) => totalsByMonth.set(key, 0));

  for (const transaction of toEligibleExpenseTransactions(transactions)) {
    const transactionMonth = toMonthKeyFromIsoDate(transaction.postedAt);
    if (!transactionMonth || !totalsByMonth.has(transactionMonth)) {
      continue;
    }

    totalsByMonth.set(transactionMonth, (totalsByMonth.get(transactionMonth) ?? 0) + Math.abs(transaction.amount));
  }

  return monthKeys.map((key) => ({
    month: key,
    label: toMonthLabel(key),
    amount: roundToTwo(totalsByMonth.get(key) ?? 0),
  }));
}

export function buildMerchantRows(
  transactions: TransactionDto[],
  monthKey: string,
  averageMonths: number,
  earliestMonthKey?: string | null,
): MerchantInsightResult {
  const averageWindowMonths = buildHistoricalAverageWindowMonths(monthKey, averageMonths, earliestMonthKey);
  const averageWindow = new Set(averageWindowMonths);
  const averageWindowMonthCount = averageWindowMonths.length;
  const rowsByMerchant = new Map<
    string,
    {
      currentMonthCount: number;
      currentMonthSpend: number;
      averageWindowCount: number;
      averageWindowSpend: number;
      averageWindowActiveMonths: Set<string>;
    }
  >();

  for (const transaction of toEligibleExpenseTransactions(transactions)) {
    const merchantName = toMerchantName(transaction);
    const transactionMonth = toMonthKeyFromIsoDate(transaction.postedAt);

    if (!transactionMonth) {
      continue;
    }

    const existing = rowsByMerchant.get(merchantName) ?? {
      currentMonthCount: 0,
      currentMonthSpend: 0,
      averageWindowCount: 0,
      averageWindowSpend: 0,
      averageWindowActiveMonths: new Set<string>(),
    };

    if (transactionMonth === monthKey) {
      existing.currentMonthCount += 1;
      existing.currentMonthSpend += Math.abs(transaction.amount);
    }

    if (averageWindow.has(transactionMonth)) {
      existing.averageWindowCount += 1;
      existing.averageWindowSpend += Math.abs(transaction.amount);
      existing.averageWindowActiveMonths.add(transactionMonth);
    }

    rowsByMerchant.set(merchantName, existing);
  }

  const rows = Array.from(rowsByMerchant.entries()).map(([merchantName, values]) => {
    const averageSpendMonthCount = values.averageWindowActiveMonths.size;

    return {
      merchantName,
      currentMonthTransactionCount: values.currentMonthCount,
      currentMonthSpend: roundToTwo(values.currentMonthSpend),
      averageTransactionCountPerMonth: averageWindowMonthCount > 0 ? roundToTwo(values.averageWindowCount / averageWindowMonthCount) : 0,
      averageSpendPerMonth: averageSpendMonthCount > 0 ? roundToTwo(values.averageWindowSpend / averageSpendMonthCount) : 0,
    };
  });

  return {
    rows,
    effectiveAverageMonths: averageWindowMonthCount,
  };
}

export function sortMerchantRows(
  rows: MerchantInsightRow[],
  sortColumn: MerchantSortColumn,
  sortDirection: SortDirection,
): MerchantInsightRow[] {
  const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    if (sortColumn === 'merchantName') {
      const byName = left.merchantName.localeCompare(right.merchantName, undefined, { sensitivity: 'base' });
      return byName * directionMultiplier;
    }

    const byValue = compareNumericField(left, right, sortColumn) * directionMultiplier;
    if (Math.abs(byValue) > 0.0001) {
      return byValue;
    }

    return left.merchantName.localeCompare(right.merchantName, undefined, { sensitivity: 'base' });
  });
}

function compareNumericField(left: MerchantInsightRow, right: MerchantInsightRow, field: Exclude<MerchantSortColumn, 'merchantName'>): number {
  if (field === 'currentMonthTransactionCount') {
    return left.currentMonthTransactionCount - right.currentMonthTransactionCount;
  }
  if (field === 'currentMonthSpend') {
    return left.currentMonthSpend - right.currentMonthSpend;
  }
  if (field === 'averageTransactionCountPerMonth') {
    return left.averageTransactionCountPerMonth - right.averageTransactionCountPerMonth;
  }
  return left.averageSpendPerMonth - right.averageSpendPerMonth;
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function toMonthIndex(monthKey: string): number | null {
  if (!monthKeyPattern.test(monthKey)) {
    return null;
  }

  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return year * 12 + (month - 1);
}

function toMonthKeyFromIndex(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12);
  const normalizedMonth = (monthIndex % 12) + 1;
  return `${year}-${String(normalizedMonth).padStart(2, '0')}`;
}
