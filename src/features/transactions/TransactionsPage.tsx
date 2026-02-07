import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultTransactionFilters } from '@domain/transactions';
import { formatCurrency, formatDate } from '@domain/format';
import { getAccounts } from '@shared/api/endpoints/accounts';
import { createCategorizationRule, getCategories } from '@shared/api/endpoints/categories';
import {
  getTransactionCoverage,
  getTransactions,
  getTransfers,
  markTransfer,
  unlinkTransfer,
  updateTransaction,
  type TransactionDto,
} from '@shared/api/endpoints/transactions';
import type { TransactionFilters } from '@domain/types';
import { queryKeys } from '@shared/query/keys';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { TransactionRow } from '@features/transactions/components/TransactionRow';

const emptyRuleForm = {
  name: '',
  pattern: '',
  patternType: 'CONTAINS' as 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXACT' | 'REGEX',
  matchField: 'DESCRIPTION' as 'DESCRIPTION' | 'PAYEE' | 'MEMO',
  categoryId: '',
  priority: '0',
  active: true,
};

const UNCATEGORIZED_FILTER_VALUE = '__uncategorized__';

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>(defaultTransactionFilters());
  const [ruleForm, setRuleForm] = useState<null | (typeof emptyRuleForm & { source: string })>(null);

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

  const createRuleMutation = useMutation({
    mutationFn: createCategorizationRule,
    onSuccess: () => {
      setRuleForm(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.rules() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const transfersQuery = useQuery({
    queryKey: queryKeys.transactions.transfers(),
    queryFn: getTransfers,
  });

  const markTransferMutation = useMutation({
    mutationFn: ({ id, pairId }: { id: number; pairId: number }) => markTransfer(id, pairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: unlinkTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const categoryFilterOptions = useMemo(
    () => categoryOptions.filter((category) => !(category.system && category.name.toLowerCase() === 'uncategorized')),
    [categoryOptions],
  );

  const openRuleForm = (transaction: TransactionDto) => {
    const description = (transaction.description ?? '').trim();
    setRuleForm({
      ...emptyRuleForm,
      name: description,
      pattern: description,
      categoryId: transaction.category?.id ? String(transaction.category.id) : '',
      source: transaction.description ?? transaction.payee ?? transaction.memo ?? 'Selected transaction',
    });
  };

  const submitRule = () => {
    if (!ruleForm) {
      return;
    }

    createRuleMutation.mutate({
      name: ruleForm.name.trim(),
      pattern: ruleForm.pattern.trim(),
      patternType: ruleForm.patternType,
      matchField: ruleForm.matchField,
      categoryId: Number(ruleForm.categoryId),
      priority: Number(ruleForm.priority) || 0,
      active: ruleForm.active,
    });
  };

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
            value={filters.uncategorized ? UNCATEGORIZED_FILTER_VALUE : filters.categoryId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => {
                if (value === '') {
                  return { ...prev, categoryId: undefined, uncategorized: undefined, offset: 0 };
                }
                if (value === UNCATEGORIZED_FILTER_VALUE) {
                  return { ...prev, categoryId: undefined, uncategorized: true, offset: 0 };
                }
                return { ...prev, categoryId: Number(value), uncategorized: undefined, offset: 0 };
              });
            }}
          >
            <option value="">All categories</option>
            <option value={UNCATEGORIZED_FILTER_VALUE}>Uncategorized</option>
            {categoryFilterOptions.map((category) => (
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
                    disabled={updateMutation.isPending || markTransferMutation.isPending}
                    onCategoryChange={(transactionId, categoryId) => updateMutation.mutate({ id: transactionId, payload: { categoryId } })}
                    onExcludeToggle={(transactionId, excludeFromTotals) =>
                      updateMutation.mutate({ id: transactionId, payload: { excludeFromTotals } })
                    }
                    onNotesSave={(transactionId, notes) => updateMutation.mutate({ id: transactionId, payload: { notes } })}
                    onAddRule={openRuleForm}
                    onMarkTransfer={(transactionId, pairId) => markTransferMutation.mutate({ id: transactionId, pairId })}
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

      <Card title="Transfer Pairs">
        {transfersQuery.data && transfersQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>From Account</th>
                <th>To Account</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfersQuery.data.map((pair) => (
                <tr key={`${pair.fromTransactionId}-${pair.toTransactionId}`}>
                  <td>{formatDate(pair.date)}</td>
                  <td>{pair.description ?? 'Transfer'}</td>
                  <td>{pair.fromAccountName}</td>
                  <td>{pair.toAccountName}</td>
                  <td className="number">{formatCurrency(pair.amount)}</td>
                  <td>{pair.autoDetected ? <Badge>Auto-detected</Badge> : <Badge>Manual</Badge>}</td>
                  <td>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => unlinkMutation.mutate(pair.fromTransactionId)}
                      disabled={unlinkMutation.isPending}
                    >
                      Unlink
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No transfer pairs" description="Transfer pairs will appear here when transactions are linked as internal transfers." />
        )}
      </Card>

      {ruleForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 24, 41, 0.35)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
            padding: '1rem',
          }}
        >
          <div style={{ width: 'min(860px, 100%)' }}>
            <Card
              title="Add Auto-Categorization Rule"
              actions={
                <Button type="button" variant="secondary" onClick={() => setRuleForm(null)} disabled={createRuleMutation.isPending}>
                  Close
                </Button>
              }
            >
              <p className="subtle" style={{ marginBottom: '1rem' }}>
                Prefilled from: {ruleForm.source}
              </p>

              <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <Input
                  id="tx-rule-name"
                  label="Rule name"
                  value={ruleForm.name}
                  onChange={(event) => setRuleForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                />

                <Input
                  id="tx-rule-pattern"
                  label="Match text"
                  value={ruleForm.pattern}
                  onChange={(event) => setRuleForm((prev) => (prev ? { ...prev, pattern: event.target.value } : prev))}
                />

                <Select
                  id="tx-rule-category"
                  label="Assign category"
                  value={ruleForm.categoryId}
                  onChange={(event) => setRuleForm((prev) => (prev ? { ...prev, categoryId: event.target.value } : prev))}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>

                <Select
                  id="tx-rule-match-field"
                  label="Match field"
                  value={ruleForm.matchField}
                  onChange={(event) =>
                    setRuleForm((prev) =>
                      prev ? { ...prev, matchField: event.target.value as 'DESCRIPTION' | 'PAYEE' | 'MEMO' } : prev,
                    )
                  }
                >
                  <option value="DESCRIPTION">Description</option>
                  <option value="PAYEE">Payee</option>
                  <option value="MEMO">Memo</option>
                </Select>

                <Select
                  id="tx-rule-pattern-type"
                  label="Pattern type"
                  value={ruleForm.patternType}
                  onChange={(event) =>
                    setRuleForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            patternType: event.target.value as 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXACT' | 'REGEX',
                          }
                        : prev,
                    )
                  }
                >
                  <option value="CONTAINS">Contains</option>
                  <option value="STARTS_WITH">Starts with</option>
                  <option value="ENDS_WITH">Ends with</option>
                  <option value="EXACT">Exact</option>
                  <option value="REGEX">Regex</option>
                </Select>

                <Input
                  id="tx-rule-priority"
                  label="Priority"
                  type="number"
                  value={ruleForm.priority}
                  onChange={(event) => setRuleForm((prev) => (prev ? { ...prev, priority: event.target.value } : prev))}
                />

                <Select
                  id="tx-rule-active"
                  label="Status"
                  value={ruleForm.active ? 'active' : 'inactive'}
                  onChange={(event) =>
                    setRuleForm((prev) => (prev ? { ...prev, active: event.target.value === 'active' } : prev))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button
                  type="button"
                  onClick={submitRule}
                  disabled={
                    createRuleMutation.isPending ||
                    !ruleForm.name.trim() ||
                    !ruleForm.pattern.trim() ||
                    !ruleForm.categoryId
                  }
                >
                  Create rule
                </Button>
                <Button type="button" variant="secondary" onClick={() => setRuleForm(null)} disabled={createRuleMutation.isPending}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
