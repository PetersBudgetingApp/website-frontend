import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatMonth, getCurrentMonthKey } from '@domain/format';
import type { BudgetTarget } from '@domain/types';
import { getSpendingByCategory } from '@shared/api/endpoints/analytics';
import { deleteBudgetTarget, getBudgetMonth, upsertBudgetMonth } from '@shared/api/endpoints/budgets';
import { getCategories } from '@shared/api/endpoints/categories';
import { getTransactions } from '@shared/api/endpoints/transactions';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { monthToDateRange } from '@shared/utils/date';
import { getBudgetPerformance } from '@features/budgets/budgetStore';
import { BudgetEditorTable } from '@features/budgets/components/BudgetEditorTable';

function listMonths(count = 12) {
  const values: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, '0')}`;
    values.push(key);
  }
  return values;
}

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(getCurrentMonthKey());
  const [targetsByCategory, setTargetsByCategory] = useState<Record<number, BudgetTarget>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { startDate, endDate } = monthToDateRange(month);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
  });

  const spendingQuery = useQuery({
    queryKey: queryKeys.analytics.spending(startDate, endDate),
    queryFn: () => getSpendingByCategory(startDate, endDate),
  });

  const uncategorizedQuery = useQuery({
    queryKey: queryKeys.transactions.uncategorized(startDate, endDate),
    queryFn: () =>
      getTransactions({
        includeTransfers: false,
        startDate,
        endDate,
        limit: 500,
        offset: 0,
    }),
  });

  const budgetMonthQuery = useQuery({
    queryKey: queryKeys.budgets.month(month),
    queryFn: () => getBudgetMonth(month),
  });

  const expenseCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter((item) => item.categoryType === 'EXPENSE'),
    [categoriesQuery.data],
  );

  const expenseCategoryNameById = useMemo(
    () => new Map(expenseCategories.map((category) => [category.id, category.name])),
    [expenseCategories],
  );

  const actualByCategory = useMemo(() => {
    const map = new Map<number, number>();
    spendingQuery.data?.categories.forEach((item) => {
      if (item.categoryId !== null && item.categoryId !== undefined) {
        map.set(item.categoryId, item.amount);
      }
    });
    return map;
  }, [spendingQuery.data]);

  const uncategorizedCount = useMemo(
    () => (uncategorizedQuery.data ?? []).filter((item) => item.amount < 0 && !item.category).length,
    [uncategorizedQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (targets: BudgetTarget[]) => upsertBudgetMonth(month, targets),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.budgets.month(month), saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all() });
      setSaveMessage(`Saved ${saved.targets.length} targets for ${formatMonth(month)}.`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => deleteBudgetTarget(month, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.month(month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all() });
    },
  });

  useEffect(() => {
    const targets = budgetMonthQuery.data?.targets ?? [];
    const map: Record<number, BudgetTarget> = {};
    targets.forEach((target) => {
      map[target.categoryId] = {
        categoryId: target.categoryId,
        categoryName: expenseCategoryNameById.get(target.categoryId) ?? 'Unknown',
        targetAmount: target.targetAmount,
        notes: target.notes ?? '',
      };
    });
    setTargetsByCategory(map);
  }, [budgetMonthQuery.data, expenseCategoryNameById]);

  const targetList = useMemo(
    () => Object.values(targetsByCategory).filter((target) => target.targetAmount > 0 || (target.notes ?? '').trim().length > 0),
    [targetsByCategory],
  );

  const performance = useMemo(() => {
    return getBudgetPerformance({
      categories: expenseCategories.map((item) => ({ id: item.id, name: item.name })),
      targets: targetList,
      actualByCategory,
    });
  }, [expenseCategories, targetList, actualByCategory]);

  const saveTargets = () => {
    saveMutation.mutate(targetList);
  };

  const deleteTarget = (categoryId: number) => {
    setTargetsByCategory((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    deleteMutation.mutate(categoryId);
  };

  if (!categoriesQuery.data || !spendingQuery.data || !budgetMonthQuery.data) {
    return (
      <section className="page">
        <h2>Budgets</h2>
        <p>Loading budget data...</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Budgets</h2>

      <Card title="Monthly Targets" actions={<strong>{formatMonth(month)}</strong>}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'end', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          <label className="field" htmlFor="month-select" style={{ maxWidth: '220px' }}>
            <span className="field-label">Month</span>
            <select id="month-select" className="select" value={month} onChange={(event) => setMonth(event.target.value)}>
              {listMonths().map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonth(monthKey)}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" onClick={saveTargets} disabled={saveMutation.isPending}>
            Save Monthly Targets
          </Button>

          {saveMessage && <p className="subtle">{saveMessage}</p>}
        </div>

        {expenseCategories.length > 0 ? (
          <BudgetEditorTable
            categories={expenseCategories}
            targetsByCategory={targetsByCategory}
            actualByCategory={actualByCategory}
            onDeleteTarget={deleteTarget}
            onTargetChange={(categoryId, field, value) => {
              const categoryName = expenseCategories.find((item) => item.id === categoryId)?.name ?? 'Unknown';
              setTargetsByCategory((prev) => {
                const base = prev[categoryId] ?? {
                  categoryId,
                  categoryName,
                  targetAmount: 0,
                  notes: '',
                };

                return {
                  ...prev,
                  [categoryId]: {
                    ...base,
                    [field]: field === 'targetAmount' ? Number(value || 0) : value,
                  },
                };
              });
            }}
          />
        ) : (
          <EmptyState title="No expense categories" description="Create or sync categories before setting budgets." />
        )}
      </Card>

      <Card title="Budget vs Actual">
        {performance.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((row) => (
                <tr key={row.categoryId}>
                  <td>{row.categoryName}</td>
                  <td className="number">{formatCurrency(row.targetAmount)}</td>
                  <td className="number">{formatCurrency(row.actualAmount)}</td>
                  <td className={`number ${row.varianceAmount < 0 ? 'field-error' : ''}`}>{formatCurrency(row.varianceAmount)}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No targets yet" description="Set monthly category targets to start comparisons." />
        )}
      </Card>

      <Card title="Uncategorized Spending Warning">
        {uncategorizedCount > 0 ? (
          <p>
            {uncategorizedCount} uncategorized spending transactions found for {formatMonth(month)}. Categorize these so budget insights stay
            accurate.
          </p>
        ) : (
          <p className="subtle">No uncategorized spending for this month.</p>
        )}
      </Card>
    </section>
  );
}
