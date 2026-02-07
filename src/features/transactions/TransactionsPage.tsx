import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultTransactionFilters } from '@domain/transactions';
import { formatDate } from '@domain/format';
import { getAccounts } from '@shared/api/endpoints/accounts';
import { getCategories } from '@shared/api/endpoints/categories';
import { getTransactionCoverage, getTransactions, updateTransaction } from '@shared/api/endpoints/transactions';
import type { TransactionFilters } from '@domain/types';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { TransactionRow } from '@features/transactions/components/TransactionRow';

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>(defaultTransactionFilters());

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.all(),
    queryFn: getAccounts,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
  });

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => getTransactions(filters),
  });

  const coverageQuery = useQuery({
    queryKey: queryKeys.transactions.coverage(),
    queryFn: getTransactionCoverage,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { categoryId?: number | null; notes?: string; excludeFromTotals?: boolean };
    }) =>
      updateTransaction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  return (
    <section className="page">
      <h2>Transactions</h2>

      <Card title="Filters">
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          <Input
            id="start-date"
            type="date"
            label="Start"
            value={filters.startDate ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value || undefined, offset: 0 }))}
          />

          <Input
            id="end-date"
            type="date"
            label="End"
            value={filters.endDate ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value || undefined, offset: 0 }))}
          />

          <Select
            id="account-filter"
            label="Account"
            value={filters.accountId ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, accountId: event.target.value ? Number(event.target.value) : undefined, offset: 0 }))
            }
          >
            <option value="">All accounts</option>
            {accountsQuery.data?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>

          <Select
            id="category-filter"
            label="Category"
            value={filters.categoryId ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : undefined, offset: 0 }))
            }
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <label className="field" htmlFor="include-transfers">
            <span className="field-label">Transfers</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: '42px' }}>
              <input
                id="include-transfers"
                type="checkbox"
                checked={filters.includeTransfers}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, includeTransfers: event.target.checked, offset: 0 }))
                }
              />
              Include internal transfers
            </label>
          </label>
        </div>
      </Card>

      <Card title="Imported Transaction Coverage">
        {coverageQuery.data ? (
          <div className="grid-cards">
            <div>
              <p className="subtle">Total Imported</p>
              <p className="number">{coverageQuery.data.totalTransactions}</p>
            </div>
            <div>
              <p className="subtle">Oldest Imported</p>
              <p className="number">{formatDate(coverageQuery.data.oldestPostedAt ?? null)}</p>
            </div>
            <div>
              <p className="subtle">Newest Imported</p>
              <p className="number">{formatDate(coverageQuery.data.newestPostedAt ?? null)}</p>
            </div>
          </div>
        ) : (
          <p className="subtle">Loading coverage...</p>
        )}
      </Card>

      <Card title="Unified Transactions">
        {transactionsQuery.data && transactionsQuery.data.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Totals</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactionsQuery.data.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    categories={categoryOptions}
                    disabled={updateMutation.isPending}
                    onCategoryChange={(transactionId, categoryId) => updateMutation.mutate({ id: transactionId, payload: { categoryId } })}
                    onExcludeToggle={(transactionId, excludeFromTotals) =>
                      updateMutation.mutate({ id: transactionId, payload: { excludeFromTotals } })
                    }
                    onNotesSave={(transactionId, notes) => updateMutation.mutate({ id: transactionId, payload: { notes } })}
                  />
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
              <Button
                variant="secondary"
                onClick={() => setFilters((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={filters.offset === 0}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                onClick={() => setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={(transactionsQuery.data?.length ?? 0) < filters.limit}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <EmptyState title="No transactions" description="Adjust filters or run a sync in Connections." />
        )}
      </Card>
    </section>
  );
}
