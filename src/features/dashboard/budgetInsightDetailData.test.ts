import { describe, expect, it } from 'vitest';
import {
  buildMonthRangeEndingAt,
  buildMerchantRows,
  buildMonthlySpendSeries,
  laterMonthKey,
  normalizeMonthKey,
  sortMerchantRows,
} from '@features/dashboard/budgetInsightDetailData';

const transactions = [
  {
    id: 1,
    accountId: 10,
    postedAt: '2026-02-04T14:30:00Z',
    amount: -40,
    pending: false,
    manuallyCategorized: true,
    internalTransfer: false,
    excludeFromTotals: false,
    recurring: false,
    payee: 'Coffee Spot',
    description: 'Coffee Spot',
    memo: null,
  },
  {
    id: 2,
    accountId: 10,
    postedAt: '2026-02-09T14:30:00Z',
    amount: -30,
    pending: false,
    manuallyCategorized: true,
    internalTransfer: false,
    excludeFromTotals: false,
    recurring: false,
    payee: 'Coffee Spot',
    description: 'Coffee Spot',
    memo: null,
  },
  {
    id: 3,
    accountId: 10,
    postedAt: '2026-01-11T14:30:00Z',
    amount: -60,
    pending: false,
    manuallyCategorized: true,
    internalTransfer: false,
    excludeFromTotals: false,
    recurring: false,
    payee: 'Coffee Spot',
    description: 'Coffee Spot',
    memo: null,
  },
  {
    id: 4,
    accountId: 10,
    postedAt: '2025-12-19T14:30:00Z',
    amount: -120,
    pending: false,
    manuallyCategorized: true,
    internalTransfer: false,
    excludeFromTotals: false,
    recurring: false,
    payee: 'Market Store',
    description: 'Market Store',
    memo: null,
  },
] as const;

describe('budgetInsightDetailData', () => {
  it('normalizes malformed month keys', () => {
    expect(normalizeMonthKey('2026-13', '2026-02')).toBe('2026-02');
    expect(normalizeMonthKey('2026-02', '2026-01')).toBe('2026-02');
  });

  it('selects the later month boundary when both exist', () => {
    expect(laterMonthKey('2025-08', '2025-10')).toBe('2025-10');
    expect(laterMonthKey('2025-11', '2025-10')).toBe('2025-11');
    expect(laterMonthKey(null, '2025-10')).toBe('2025-10');
  });

  it('builds monthly spend series with zeros for missing months', () => {
    const result = buildMonthlySpendSeries([...transactions], '2026-02', 3);

    expect(result.map((entry) => entry.month)).toEqual(['2025-12', '2026-01', '2026-02']);
    expect(result.map((entry) => entry.amount)).toEqual([120, 60, 70]);
  });

  it('clips chart range to available history when earliest month is provided', () => {
    const monthRange = buildMonthRangeEndingAt('2026-02', 12, '2025-08');
    expect(monthRange[0]).toBe('2025-08');
    expect(monthRange[monthRange.length - 1]).toBe('2026-02');

    const result = buildMonthlySpendSeries([...transactions], '2026-02', 12, '2025-12');
    expect(result.map((entry) => entry.month)).toEqual(['2025-12', '2026-01', '2026-02']);
  });

  it('builds merchant rows and sorts by average spend descending', () => {
    const merchantInsights = buildMerchantRows([...transactions], '2026-02', 12, '2025-12');
    const sorted = sortMerchantRows(merchantInsights.rows, 'averageSpendPerMonth', 'desc');

    expect(merchantInsights.effectiveAverageMonths).toBe(2);

    expect(sorted[0]?.merchantName).toBe('Market Store');
    expect(sorted[0]?.currentMonthSpend).toBe(0);
    expect(sorted[0]?.averageSpendPerMonth).toBe(120);

    expect(sorted[1]?.merchantName).toBe('Coffee Spot');
    expect(sorted[1]?.currentMonthTransactionCount).toBe(2);
    expect(sorted[1]?.averageTransactionCountPerMonth).toBe(0.5);
    expect(sorted[1]?.averageSpendPerMonth).toBe(60);
  });
});
