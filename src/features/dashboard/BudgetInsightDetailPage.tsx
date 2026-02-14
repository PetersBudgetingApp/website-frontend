import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appRoutes } from '@app/routes';
import { formatCurrency, formatMonth, getCurrentMonthKey } from '@domain/format';
import {
  buildHistoricalAverageWindowMonths,
  buildMerchantRows,
  buildMonthlySpendSeries,
  findEarliestTransactionMonthKey,
  laterMonthKey,
  normalizeMonthKey,
  sortMerchantRows,
  toMonthKeyFromIsoDate,
  type MerchantSortColumn,
  type SortDirection,
  toEligibleExpenseTransactions,
} from '@features/dashboard/budgetInsightDetailData';
import { toMtdNarrative } from '@features/dashboard/budgetInsightsText';
import { BudgetCategorySpendChart } from '@features/dashboard/components/BudgetCategorySpendChart';
import { buildTransactionsPath } from '@features/transactions/transactionRouteFilters';
import { getBudgetInsights } from '@shared/api/endpoints/analytics';
import { getCategories } from '@shared/api/endpoints/categories';
import { getTransactionCoverage, getTransactions, type TransactionDto } from '@shared/api/endpoints/transactions';
import { queryKeys } from '@shared/query/keys';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';

const TREND_MONTHS = 12;
const MERCHANT_AVERAGE_MONTH_OPTIONS = [3, 6, 12, 24];
const TRANSACTION_PAGE_SIZE = 500;
const MAX_TRANSACTION_PAGES = 250;

async function getCategoryTransactions(categoryId: number): Promise<TransactionDto[]> {
  const allTransactions: TransactionDto[] = [];
  let offset = 0;
  let page = 0;

  while (page < MAX_TRANSACTION_PAGES) {
    const transactions = await getTransactions({
      includeTransfers: false,
      categoryId,
      limit: TRANSACTION_PAGE_SIZE,
      offset,
    });

    allTransactions.push(...transactions);

    if (transactions.length < TRANSACTION_PAGE_SIZE) {
      break;
    }

    page += 1;
    offset += TRANSACTION_PAGE_SIZE;
  }

  return allTransactions;
}

function toAriaSort(column: MerchantSortColumn, activeColumn: MerchantSortColumn, direction: SortDirection): 'none' | 'ascending' | 'descending' {
  if (column !== activeColumn) {
    return 'none';
  }

  return direction === 'asc' ? 'ascending' : 'descending';
}

function toSortIndicator(column: MerchantSortColumn, activeColumn: MerchantSortColumn, direction: SortDirection): string {
  if (column !== activeColumn) {
    return '';
  }

  return direction === 'asc' ? ' \u2191' : ' \u2193';
}

const BACK_TARGETS: Record<string, string> = {
  [appRoutes.budgets]: 'Budgets',
  [appRoutes.dashboard]: 'Dashboard',
};

export function BudgetInsightDetailPage() {
  const { categoryId: categoryIdRaw } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromRoute = (location.state as { from?: string } | null)?.from;
  const backTo = fromRoute && BACK_TARGETS[fromRoute] ? fromRoute : appRoutes.dashboard;
  const backLabel = BACK_TARGETS[backTo] ?? 'Dashboard';
  const currentMonth = getCurrentMonthKey();
  const month = normalizeMonthKey(searchParams.get('month'), currentMonth);
  const categoryId = Number(categoryIdRaw);

  const [merchantAverageMonths, setMerchantAverageMonths] = useState(6);
  const [sortColumn, setSortColumn] = useState<MerchantSortColumn>('averageSpendPerMonth');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const insightsQuery = useQuery({
    queryKey: queryKeys.analytics.budgetInsights(month, 6),
    queryFn: () => getBudgetInsights(month, 6),
    enabled: Number.isFinite(categoryId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
    enabled: Number.isFinite(categoryId),
  });

  const transactionsQuery = useQuery({
    queryKey: queryKeys.analytics.budgetInsightTransactions(categoryId),
    queryFn: () => getCategoryTransactions(categoryId),
    enabled: Number.isFinite(categoryId),
  });

  const transactionCoverageQuery = useQuery({
    queryKey: queryKeys.transactions.coverage(),
    queryFn: getTransactionCoverage,
    enabled: Number.isFinite(categoryId),
  });

  const categoryInsight = useMemo(
    () => insightsQuery.data?.categories.find((item) => item.categoryId === categoryId),
    [insightsQuery.data, categoryId],
  );

  const category = useMemo(
    () => categoriesQuery.data?.find((item) => item.id === categoryId),
    [categoriesQuery.data, categoryId],
  );

  const categoryName = categoryInsight?.categoryName ?? category?.name ?? `Category ${categoryId}`;
  const eligibleTransactions = useMemo(
    () => toEligibleExpenseTransactions(transactionsQuery.data ?? []),
    [transactionsQuery.data],
  );

  const earliestAvailableMonth = useMemo(() => {
    const coverageMonth = toMonthKeyFromIsoDate(transactionCoverageQuery.data?.oldestPostedAt);
    const categoryMonth = findEarliestTransactionMonthKey(eligibleTransactions);
    return laterMonthKey(coverageMonth, categoryMonth);
  }, [transactionCoverageQuery.data?.oldestPostedAt, eligibleTransactions]);

  const monthlySeries = useMemo(
    () => buildMonthlySpendSeries(eligibleTransactions, month, TREND_MONTHS, earliestAvailableMonth),
    [eligibleTransactions, month, earliestAvailableMonth],
  );

  const fallbackAverageSpend = useMemo(() => {
    if (monthlySeries.length === 0) {
      return 0;
    }
    const total = monthlySeries.reduce((sum, point) => sum + point.amount, 0);
    return Number((total / monthlySeries.length).toFixed(2));
  }, [monthlySeries]);

  const currentMonthSpend = categoryInsight?.currentMonthSpend ?? monthlySeries[monthlySeries.length - 1]?.amount ?? 0;
  const averageMonthlySpend = categoryInsight?.averageMonthlySpend ?? fallbackAverageSpend;
  const recommendedBudget = categoryInsight?.recommendedBudget ?? averageMonthlySpend;
  const currentBudget = categoryInsight?.currentBudget ?? 0;

  const merchantRows = useMemo(
    () => buildMerchantRows(eligibleTransactions, month, merchantAverageMonths, earliestAvailableMonth),
    [eligibleTransactions, month, merchantAverageMonths, earliestAvailableMonth],
  );

  const effectiveMerchantAverageMonths = merchantRows.effectiveAverageMonths;

  const merchantAverageWindowStartMonth = useMemo(() => {
    const windowMonths = buildHistoricalAverageWindowMonths(month, merchantAverageMonths, earliestAvailableMonth);
    return windowMonths.length > 0 ? windowMonths[0] : null;
  }, [month, merchantAverageMonths, earliestAvailableMonth]);

  const sortedMerchantRows = useMemo(
    () => sortMerchantRows(merchantRows.rows, sortColumn, sortDirection),
    [merchantRows.rows, sortColumn, sortDirection],
  );

  const updateSort = (column: MerchantSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === 'merchantName' ? 'asc' : 'desc');
  };

  if (!Number.isFinite(categoryId)) {
    return (
      <section className="page">
        <h2>Budget Insight Details</h2>
        <EmptyState title="Invalid category" description="Select a category from Budget Alignment Insights to view details." />
      </section>
    );
  }

  if (transactionsQuery.isLoading || insightsQuery.isLoading || categoriesQuery.isLoading || transactionCoverageQuery.isLoading) {
    return (
      <section className="page">
        <h2>Budget Insight Details</h2>
        <Spinner />
      </section>
    );
  }

  if (transactionsQuery.isError) {
    return (
      <section className="page">
        <h2>Budget Insight Details</h2>
        <EmptyState title="Could not load category activity" description="Try refreshing after transactions sync completes." />
      </section>
    );
  }

  return (
    <section className="page">
      <p className="budget-insight-detail-backlink">
        <Link to={backTo} state={backTo === appRoutes.budgets ? { tab: 'insights' } : undefined}>&larr; Back to {backLabel}</Link>
      </p>

      <div className="budget-insight-detail-header">
        <h2>{categoryName} Insight</h2>
        <p className="subtle">Detailed category behavior for {formatMonth(month)}</p>
      </div>

      <Card title="Budget Snapshot" className="budget-insight-detail-summary-card">
        <div className="budget-insight-detail-metrics">
          <article className="budget-insight-detail-metric">
            <p className="subtle">Current Budget</p>
            <p className="number">{formatCurrency(currentBudget)}</p>
          </article>
          <article className="budget-insight-detail-metric">
            <p className="subtle">Recommended Budget</p>
            <p className="number">{formatCurrency(recommendedBudget)}</p>
          </article>
          <article className="budget-insight-detail-metric">
            <p className="subtle">Average Spend</p>
            <p className="number">{formatCurrency(averageMonthlySpend)}</p>
          </article>
          <article className="budget-insight-detail-metric">
            <p className="subtle">Current Spend</p>
            <p className="number">{formatCurrency(currentMonthSpend)}</p>
          </article>
        </div>
        <p className="subtle budget-insight-detail-narrative">
          {toMtdNarrative(categoryName, categoryInsight?.monthToDateDeltaPct, categoryInsight?.monthToDateSpend ?? currentMonthSpend)}
        </p>
      </Card>

      <Card title="Monthly Spending Trend">
        <BudgetCategorySpendChart
          points={monthlySeries}
          averageSpend={averageMonthlySpend}
          isLoading={false}
          isError={false}
        />
      </Card>

      <Card title="Merchant Activity">
        <div className="budget-insight-merchant-controls">
          <label className="field" htmlFor="merchant-average-months">
            <span className="field-label">Average months</span>
            <select
              id="merchant-average-months"
              className="select budget-insight-average-select"
              value={merchantAverageMonths}
              onChange={(event) => setMerchantAverageMonths(Number(event.target.value))}
            >
              {MERCHANT_AVERAGE_MONTH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} months
                </option>
              ))}
            </select>
          </label>
          <p className="subtle">
            {effectiveMerchantAverageMonths > 0
              ? `Averages are calculated over ${effectiveMerchantAverageMonths} month${
                effectiveMerchantAverageMonths === 1 ? '' : 's'
              } before ${formatMonth(month)}${
                effectiveMerchantAverageMonths < merchantAverageMonths && merchantAverageWindowStartMonth
                  ? ` (limited by available data starting ${formatMonth(merchantAverageWindowStartMonth)}).`
                  : '.'
              } Avg Spend/Month uses only months where each merchant had at least one transaction.`
              : `No prior-month history is available before ${formatMonth(month)}.`}
          </p>
        </div>

        {sortedMerchantRows.length === 0 ? (
          <EmptyState title="No merchant activity yet" description="Transactions in this category will appear once available." />
        ) : (
          <div className="table-responsive">
            <table className="table budget-insight-merchant-table">
              <thead>
                <tr>
                  <th aria-sort={toAriaSort('merchantName', sortColumn, sortDirection)}>
                    <button type="button" className="table-sort-button" onClick={() => updateSort('merchantName')}>
                      Merchant{toSortIndicator('merchantName', sortColumn, sortDirection)}
                    </button>
                  </th>
                  <th aria-sort={toAriaSort('currentMonthTransactionCount', sortColumn, sortDirection)}>
                    <button type="button" className="table-sort-button" onClick={() => updateSort('currentMonthTransactionCount')}>
                      Transactions This Month{toSortIndicator('currentMonthTransactionCount', sortColumn, sortDirection)}
                    </button>
                  </th>
                  <th aria-sort={toAriaSort('currentMonthSpend', sortColumn, sortDirection)}>
                    <button type="button" className="table-sort-button" onClick={() => updateSort('currentMonthSpend')}>
                      Current Spend This Month{toSortIndicator('currentMonthSpend', sortColumn, sortDirection)}
                    </button>
                  </th>
                  <th aria-sort={toAriaSort('averageTransactionCountPerMonth', sortColumn, sortDirection)}>
                    <button type="button" className="table-sort-button" onClick={() => updateSort('averageTransactionCountPerMonth')}>
                      Avg Transactions/Month{toSortIndicator('averageTransactionCountPerMonth', sortColumn, sortDirection)}
                    </button>
                  </th>
                  <th aria-sort={toAriaSort('averageSpendPerMonth', sortColumn, sortDirection)}>
                    <button type="button" className="table-sort-button" onClick={() => updateSort('averageSpendPerMonth')}>
                      Avg Spend/Month{toSortIndicator('averageSpendPerMonth', sortColumn, sortDirection)}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMerchantRows.map((row) => (
                  <tr
                    key={row.merchantName}
                    className="table-clickable-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(buildTransactionsPath({ merchantQuery: row.merchantName }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(buildTransactionsPath({ merchantQuery: row.merchantName }));
                      }
                    }}
                  >
                    <td>{row.merchantName}</td>
                    <td className="number">{row.currentMonthTransactionCount}</td>
                    <td className="number">{formatCurrency(row.currentMonthSpend)}</td>
                    <td className="number">{row.averageTransactionCountPerMonth.toFixed(2)}</td>
                    <td className="number">{formatCurrency(row.averageSpendPerMonth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
