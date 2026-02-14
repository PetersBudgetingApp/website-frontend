import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentMonthKey, formatCurrency } from '@domain/format';
import type { BudgetTarget } from '@domain/types';
import { appRoutes, budgetInsightDetailPath } from '@app/routes';
import { getAccountSummary } from '@shared/api/endpoints/accounts';
import { getBudgetInsights, getCashFlow, getSpendingByCategory, getTrends } from '@shared/api/endpoints/analytics';
import { getBudgetMonth, upsertBudgetMonth } from '@shared/api/endpoints/budgets';
import { getCategories } from '@shared/api/endpoints/categories';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';
import { queryKeys } from '@shared/query/keys';
import { monthToDateRange } from '@shared/utils/date';
import { getBudgetPerformance } from '@features/budgets/budgetStore';
import { BudgetInsightsPanel } from '@features/dashboard/components/BudgetInsightsPanel';
import { IncomeVsSpendingChart } from '@features/dashboard/components/IncomeVsSpendingChart';
import { NetWorthBreakdownCard } from '@features/dashboard/components/NetWorthBreakdownCard';
import { SummaryCards } from '@features/dashboard/components/SummaryCards';
import { buildTransactionsPath } from '@features/transactions/transactionRouteFilters';

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const month = getCurrentMonthKey();
  const { startDate, endDate } = monthToDateRange(month);
  const [insightStatusMessage, setInsightStatusMessage] = useState<string | null>(null);

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

  const budgetInsightsQuery = useQuery({
    queryKey: queryKeys.analytics.budgetInsights(month, 6),
    queryFn: () => getBudgetInsights(month, 6),
  });

  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const applyRecommendationMutation = useMutation({
    mutationFn: async (input: { categoryId: number; recommendedBudget: number; categoryName: string }) => {
      if (!budgetMonthQuery.data) {
        throw new Error('Budget month data is not loaded.');
      }

      const targetsByCategoryId = new Map(
        budgetMonthQuery.data.targets.map((target) => [
          target.categoryId,
          {
            categoryId: target.categoryId,
            targetAmount: target.targetAmount,
            notes: target.notes ?? '',
          },
        ]),
      );

      const existingTarget = targetsByCategoryId.get(input.categoryId);
      targetsByCategoryId.set(input.categoryId, {
        categoryId: input.categoryId,
        targetAmount: Number(input.recommendedBudget.toFixed(2)),
        notes: existingTarget?.notes ?? '',
      });

      const nextTargets: BudgetTarget[] = Array.from(targetsByCategoryId.values()).map((target) => ({
        categoryId: target.categoryId,
        categoryName: categoryNameById.get(target.categoryId) ?? 'Unknown',
        targetAmount: target.targetAmount,
        notes: target.notes,
      }));

      return upsertBudgetMonth(month, nextTargets);
    },
    onSuccess: (saved, variables) => {
      queryClient.setQueryData(queryKeys.budgets.month(month), saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.budgetInsights(month, 6) });
      setInsightStatusMessage(
        `Updated ${variables.categoryName} budget to ${formatCurrency(Number(variables.recommendedBudget.toFixed(2)))}.`,
      );
    },
    onError: () => {
      setInsightStatusMessage('Could not apply recommendation. Try again.');
    },
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
      <IncomeVsSpendingChart
        trends={trendsQuery.data?.trends ?? []}
        isLoading={trendsQuery.isLoading}
        isError={trendsQuery.isError}
        onMonthSelect={(selectedMonth) => navigate(buildTransactionsPath({ month: selectedMonth }))}
      />
      <NetWorthBreakdownCard summary={accountSummaryQuery.data} />
      <SummaryCards
        income={cashFlowQuery.data.totalIncome}
        expenses={cashFlowQuery.data.totalExpenses}
        savingsRate={cashFlowQuery.data.savingsRate}
        onIncomeClick={() => navigate(buildTransactionsPath({ amountOperator: 'gt', amountValue: 0 }))}
        onExpensesClick={() => navigate(buildTransactionsPath({ amountOperator: 'lt', amountValue: 0 }))}
      />

      <div className="grid-cards dashboard-summary-grid">
        <Card title="Spending by Category (Current Month)">
          {spendingQuery.data.categories.length === 0 ? (
            <EmptyState title="No spending yet" description="Transactions will appear after sync." />
          ) : (
            <div className="table-responsive">
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
                    <tr
                      key={`${item.categoryName}-${item.categoryId ?? 'none'}`}
                      className="table-clickable-row"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          buildTransactionsPath({
                            month,
                            categoryId: item.categoryId ?? undefined,
                            uncategorized: item.categoryId === null || item.categoryId === undefined,
                          }),
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(
                            buildTransactionsPath({
                              month,
                              categoryId: item.categoryId ?? undefined,
                              uncategorized: item.categoryId === null || item.categoryId === undefined,
                            }),
                          );
                        }
                      }}
                    >
                      <td>{item.categoryName}</td>
                      <td className="number">{formatCurrency(item.amount)}</td>
                      <td className="number">{item.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Budget Progress" onClick={() => navigate(appRoutes.budgets)}>
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

      <BudgetInsightsPanel
        insights={budgetInsightsQuery.data}
        isLoading={budgetInsightsQuery.isLoading}
        isError={budgetInsightsQuery.isError}
        applyingCategoryId={applyRecommendationMutation.isPending ? (applyRecommendationMutation.variables?.categoryId ?? null) : null}
        statusMessage={insightStatusMessage}
        onOpenDetails={(categoryId) => {
          navigate(`${budgetInsightDetailPath(categoryId)}?month=${month}`, { state: { from: appRoutes.dashboard } });
        }}
        onApplyRecommendation={(categoryId, recommendedBudget, categoryName) => {
          setInsightStatusMessage(null);
          applyRecommendationMutation.mutate({ categoryId, recommendedBudget, categoryName });
        }}
      />
    </section>
  );
}
