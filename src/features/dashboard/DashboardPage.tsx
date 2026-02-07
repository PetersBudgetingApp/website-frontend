import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentMonthKey, formatCurrency } from '@domain/format';
import { getAccountSummary } from '@shared/api/endpoints/accounts';
import { getCashFlow, getSpendingByCategory, getTrends } from '@shared/api/endpoints/analytics';
import { getBudgetMonth } from '@shared/api/endpoints/budgets';
import { getCategories } from '@shared/api/endpoints/categories';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';
import { queryKeys } from '@shared/query/keys';
import { monthToDateRange } from '@shared/utils/date';
import { getBudgetPerformance } from '@features/budgets/budgetStore';
import { IncomeVsSpendingChart } from '@features/dashboard/components/IncomeVsSpendingChart';
import { NetWorthBreakdownCard } from '@features/dashboard/components/NetWorthBreakdownCard';
import { SummaryCards } from '@features/dashboard/components/SummaryCards';

export function DashboardPage() {
  const month = getCurrentMonthKey();
  const { startDate, endDate } = monthToDateRange(month);

  const accountSummaryQuery = useQuery({
    queryKey: queryKeys.accounts.summary(),
    queryFn: getAccountSummary,
  });

  const cashFlowQuery = useQuery({
    queryKey: queryKeys.analytics.cashFlow(startDate, endDate),
    queryFn: () => getCashFlow(startDate, endDate),
  });

  const spendingQuery = useQuery({
    queryKey: queryKeys.analytics.spending(startDate, endDate),
    queryFn: () => getSpendingByCategory(startDate, endDate),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
  });

  const trendsQuery = useQuery({
    queryKey: queryKeys.analytics.trends(6),
    queryFn: () => getTrends(6),
  });

  const budgetMonthQuery = useQuery({
    queryKey: queryKeys.budgets.month(month),
    queryFn: () => getBudgetMonth(month),
  });

  const budgetSummary = useMemo(() => {
    if (!budgetMonthQuery.data || !spendingQuery.data || !categoriesQuery.data) {
      return { target: 0, actual: 0, overspentCount: 0 };
    }
    const actualByCategory = new Map<number, number>();

    spendingQuery.data.categories.forEach((item) => {
      if (item.categoryId !== null && item.categoryId !== undefined) {
        actualByCategory.set(item.categoryId, item.amount);
      }
    });

    const categoryNameById = new Map(categoriesQuery.data.map((category) => [category.id, category.name]));
    const targets = budgetMonthQuery.data.targets.map((target) => ({
      categoryId: target.categoryId,
      categoryName: categoryNameById.get(target.categoryId) ?? 'Unknown',
      targetAmount: target.targetAmount,
      notes: target.notes ?? '',
    }));

    const performance = getBudgetPerformance({
      categories: categoriesQuery.data.map((category) => ({ id: category.id, name: category.name })),
      targets,
      actualByCategory,
    });

    return {
      target: performance.reduce((sum, item) => sum + item.targetAmount, 0),
      actual: performance.reduce((sum, item) => sum + item.actualAmount, 0),
      overspentCount: performance.filter((item) => item.status === 'over').length,
    };
  }, [budgetMonthQuery.data, spendingQuery.data, categoriesQuery.data]);

  if (accountSummaryQuery.isLoading || cashFlowQuery.isLoading || spendingQuery.isLoading) {
    return (
      <section className="page">
        <h2>Dashboard</h2>
        <Spinner />
      </section>
    );
  }

  if (!accountSummaryQuery.data || !cashFlowQuery.data || !spendingQuery.data) {
    return (
      <section className="page">
        <h2>Dashboard</h2>
        <EmptyState title="Could not load dashboard" description="Try refreshing after your next sync." />
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Dashboard</h2>
      <IncomeVsSpendingChart trends={trendsQuery.data?.trends ?? []} isLoading={trendsQuery.isLoading} isError={trendsQuery.isError} />
      <NetWorthBreakdownCard summary={accountSummaryQuery.data} />
      <SummaryCards
        income={cashFlowQuery.data.totalIncome}
        expenses={cashFlowQuery.data.totalExpenses}
        savingsRate={cashFlowQuery.data.savingsRate}
      />

      <div className="grid-cards" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <Card title="Spending by Category (Current Month)">
          {spendingQuery.data.categories.length === 0 ? (
            <EmptyState title="No spending yet" description="Transactions will appear after sync." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {spendingQuery.data.categories.slice(0, 8).map((item) => (
                  <tr key={`${item.categoryName}-${item.categoryId ?? 'none'}`}>
                    <td>{item.categoryName}</td>
                    <td className="number">{formatCurrency(item.amount)}</td>
                    <td className="number">{item.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Budget Progress">
          <div className="form-grid">
            <div>
              <p className="subtle">Targeted Spend</p>
              <p className="number">{formatCurrency(budgetSummary.target)}</p>
            </div>
            <div>
              <p className="subtle">Actual Spend</p>
              <p className="number">{formatCurrency(budgetSummary.actual)}</p>
            </div>
            <div>
              <p className="subtle">Overspent Categories</p>
              <p className="number">{budgetSummary.overspentCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
