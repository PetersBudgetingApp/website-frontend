import { describe, expect, it } from 'vitest';
import { buildTransactionsPath, getInitialFiltersFromSearchParams } from '@features/transactions/transactionRouteFilters';

describe('transactionRouteFilters', () => {
  it('builds month + category transaction links', () => {
    const path = buildTransactionsPath({ month: '2026-02', categoryId: 42 });

    expect(path).toBe('/transactions?startDate=2026-02-01&endDate=2026-02-28&categoryId=42');
  });

  it('builds merchant and amount transaction links', () => {
    const path = buildTransactionsPath({ merchantQuery: 'Coffee Shop', amountOperator: 'lt', amountValue: 0 });

    expect(path).toBe('/transactions?merchantQuery=Coffee+Shop&amountOperator=lt&amountValue=0');
  });

  it('parses transaction filters from search params', () => {
    const params = new URLSearchParams(
      'includeTransfers=true&startDate=2026-02-01&endDate=2026-02-28&merchantQuery=Netflix&amountOperator=lt&amountValue=25',
    );

    const filters = getInitialFiltersFromSearchParams(params);

    expect(filters.includeTransfers).toBe(true);
    expect(filters.startDate).toBe('2026-02-01');
    expect(filters.endDate).toBe('2026-02-28');
    expect(filters.merchantQuery).toBe('Netflix');
    expect(filters.amountOperator).toBe('lt');
    expect(filters.amountValue).toBe(25);
    expect(filters.limit).toBe(10);
    expect(filters.offset).toBe(0);
  });

  it('prefers uncategorized when both uncategorized and categoryId are present', () => {
    const params = new URLSearchParams('uncategorized=true&categoryId=99');

    const filters = getInitialFiltersFromSearchParams(params);

    expect(filters.uncategorized).toBe(true);
    expect(filters.categoryId).toBeUndefined();
  });
});
