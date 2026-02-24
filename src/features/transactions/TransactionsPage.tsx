import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@domain/format';
import { getAccounts } from '@shared/api/endpoints/accounts';
import {
  createCategorizationRule,
  getCategories,
  type RuleConditionOperator,
  type RuleMatchField,
  type RulePatternType,
} from '@shared/api/endpoints/categories';
import {
  createTransaction,
  deleteTransaction,
  getTransactionCoverage,
  getTransactions,
  getTransfers,
  markTransfer,
  unlinkTransfer,
  updateTransaction,
  type TransactionDto,
} from '@shared/api/endpoints/transactions';
import { ApiClientError } from '@shared/api/httpClient';
import type { AmountFilterOperator, TransactionFilters } from '@domain/types';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { TransactionRow } from '@features/transactions/components/TransactionRow';
import { TransferPairRow } from '@features/transactions/components/TransferPairRow';
import { getInitialFiltersFromSearchParams } from '@features/transactions/transactionRouteFilters';
import { findUncategorizedCategory, sortCategoriesWithUncategorizedFirst } from '@shared/utils/categories';

const emptyRuleForm = {
  name: '',
  conditionOperator: 'AND' as RuleConditionOperator,
  conditions: [{ field: 'DESCRIPTION' as RuleMatchField, patternType: 'CONTAINS' as RulePatternType, value: '' }],
  categoryId: '',
  priority: '0',
  active: true,
};

const patternTypeLabelByValue: Record<RulePatternType, string> = {
  CONTAINS: 'Contains',
  STARTS_WITH: 'Starts with',
  ENDS_WITH: 'Ends with',
  EXACT: 'Exact',
  REGEX: 'Regex',
  EQUALS: 'Equals',
  GREATER_THAN: 'Greater than',
  GREATER_THAN_OR_EQUAL: 'Greater than or equal',
  LESS_THAN: 'Less than',
  LESS_THAN_OR_EQUAL: 'Less than or equal',
};

function defaultPatternTypeForField(field: RuleMatchField): RulePatternType {
  if (field === 'ACCOUNT') {
    return 'EQUALS';
  }
  if (field === 'AMOUNT') {
    return 'EQUALS';
  }
  return 'CONTAINS';
}

function allowedPatternTypes(field: RuleMatchField): RulePatternType[] {
  if (field === 'ACCOUNT') {
    return ['EQUALS', 'EXACT'];
  }
  if (field === 'AMOUNT') {
    return ['EXACT', 'EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL'];
  }
  return ['CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'EXACT', 'REGEX'];
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyManualTransactionForm = () => ({
  accountId: '',
  postedDate: getTodayLocalDateString(),
  transactedDate: '',
  amount: '',
  description: '',
  payee: '',
  memo: '',
  categoryId: '',
  notes: '',
  pending: false,
  excludeFromTotals: false,
});

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TransactionFilters>(() => getInitialFiltersFromSearchParams(searchParams));
  const [transferOffset, setTransferOffset] = useState(0);
  const [transferLimit, setTransferLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [ruleForm, setRuleForm] = useState<null | (typeof emptyRuleForm & { source: string })>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState(emptyManualTransactionForm);
  const [manualFormError, setManualFormError] = useState<string | null>(null);

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

  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setManualFormOpen(false);
      setManualForm(emptyManualTransactionForm());
      setManualFormError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.coverage() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        if (error.errors && Object.keys(error.errors).length > 0) {
          setManualFormError(Object.values(error.errors).join(' '));
          return;
        }
        setManualFormError(error.message);
        return;
      }
      setManualFormError('Unable to create transaction. Please try again.');
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

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.coverage() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.transfers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const categoryOptions = useMemo(
    () => sortCategoriesWithUncategorizedFirst(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const uncategorizedCategory = useMemo(() => findUncategorizedCategory(categoryOptions), [categoryOptions]);
  const transferPairs = transfersQuery.data ?? [];
  const transferPairCount = transferPairs.length;
  const pagedTransferPairs = useMemo(
    () => transferPairs.slice(transferOffset, transferOffset + transferLimit),
    [transferPairs, transferOffset, transferLimit],
  );

  useEffect(() => {
    if (transferPairCount === 0) {
      setTransferOffset(0);
      return;
    }
    const maxOffset = Math.floor((transferPairCount - 1) / transferLimit) * transferLimit;
    setTransferOffset((prev) => Math.min(prev, maxOffset));
  }, [transferLimit, transferPairCount]);

  const setUnifiedPageSize = (value: string) => {
    const nextPageSize = Number(value);
    if (!PAGE_SIZE_OPTIONS.includes(nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
      return;
    }
    setFilters((prev) => ({ ...prev, limit: nextPageSize, offset: 0 }));
  };

  const setTransferPageSize = (value: string) => {
    const nextPageSize = Number(value);
    if (!PAGE_SIZE_OPTIONS.includes(nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
      return;
    }
    setTransferLimit(nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number]);
    setTransferOffset(0);
  };

  const openManualForm = () => {
    const firstAccountId = accountsQuery.data?.[0]?.id;
    setManualForm({
      ...emptyManualTransactionForm(),
      accountId: firstAccountId ? String(firstAccountId) : '',
    });
    setManualFormError(null);
    setManualFormOpen(true);
  };

  const closeManualForm = () => {
    if (createTransactionMutation.isPending) {
      return;
    }
    setManualFormOpen(false);
    setManualFormError(null);
  };

  const submitManualForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualFormError(null);

    if (!manualForm.accountId) {
      setManualFormError('Account is required.');
      return;
    }
    if (!manualForm.postedDate) {
      setManualFormError('Posted date is required.');
      return;
    }

    const amount = Number(manualForm.amount);
    if (!Number.isFinite(amount)) {
      setManualFormError('Amount must be a valid number.');
      return;
    }
    if (amount === 0) {
      setManualFormError('Amount must be non-zero.');
      return;
    }

    const description = manualForm.description.trim();
    if (!description) {
      setManualFormError('Description is required.');
      return;
    }

    createTransactionMutation.mutate({
      accountId: Number(manualForm.accountId),
      postedDate: manualForm.postedDate,
      transactedDate: manualForm.transactedDate || undefined,
      amount,
      description,
      payee: manualForm.payee.trim() || undefined,
      memo: manualForm.memo.trim() || undefined,
      categoryId: manualForm.categoryId ? Number(manualForm.categoryId) : undefined,
      notes: manualForm.notes.trim() || undefined,
      pending: manualForm.pending,
      excludeFromTotals: manualForm.excludeFromTotals,
    });
  };

  const openRuleForm = (transaction: TransactionDto) => {
    const description = (transaction.description ?? '').trim();
    const accountId = String(transaction.accountId);
    const amount = String(transaction.amount);
    setRuleForm({
      ...emptyRuleForm,
      name: description,
      conditionOperator: 'AND',
      conditions: [
        { field: 'DESCRIPTION', patternType: 'CONTAINS', value: description },
        { field: 'ACCOUNT', patternType: 'EQUALS', value: accountId },
        { field: 'AMOUNT', patternType: 'EQUALS', value: amount },
      ],
      categoryId: transaction.category?.id
        ? String(transaction.category.id)
        : uncategorizedCategory
          ? String(uncategorizedCategory.id)
          : '',
      source: transaction.description ?? transaction.payee ?? transaction.memo ?? 'Selected transaction',
    });
  };

  const submitRule = () => {
    if (!ruleForm) {
      return;
    }

    const normalizedConditions = ruleForm.conditions.map((condition) => ({
      field: condition.field,
      patternType: condition.patternType,
      value: condition.value.trim(),
    }));
    const primaryCondition = normalizedConditions[0];

    createRuleMutation.mutate({
      name: ruleForm.name.trim(),
      pattern: primaryCondition.value,
      patternType: primaryCondition.patternType,
      matchField: primaryCondition.field,
      conditionOperator: ruleForm.conditionOperator,
      conditions: normalizedConditions,
      categoryId: Number(ruleForm.categoryId),
      priority: Number(ruleForm.priority) || 0,
      active: ruleForm.active,
    });
  };

  const setRuleConditionField = (index: number, field: RuleMatchField) => {
    setRuleForm((prev) => {
      if (!prev) {
        return prev;
      }

      const nextConditions = prev.conditions.map((condition, conditionIndex) => {
        if (conditionIndex !== index) {
          return condition;
        }

        return {
          ...condition,
          field,
          patternType: defaultPatternTypeForField(field),
          value: '',
        };
      });

      return { ...prev, conditions: nextConditions };
    });
  };

  const setRuleConditionPatternType = (index: number, patternType: RulePatternType) => {
    setRuleForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        conditions: prev.conditions.map((condition, conditionIndex) =>
          conditionIndex === index ? { ...condition, patternType } : condition,
        ),
      };
    });
  };

  const setRuleConditionValue = (index: number, value: string) => {
    setRuleForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        conditions: prev.conditions.map((condition, conditionIndex) =>
          conditionIndex === index ? { ...condition, value } : condition,
        ),
      };
    });
  };

  const addRuleCondition = () => {
    setRuleForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        conditions: [...prev.conditions, { field: 'DESCRIPTION', patternType: 'CONTAINS', value: '' }],
      };
    });
  };

  const removeRuleCondition = (index: number) => {
    setRuleForm((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        conditions: prev.conditions.filter((_, conditionIndex) => conditionIndex !== index),
      };
    });
  };

  const isRuleFormValid =
    ruleForm !== null &&
    ruleForm.name.trim().length > 0 &&
    ruleForm.categoryId.length > 0 &&
    ruleForm.conditions.length > 0 &&
    ruleForm.conditions.every((condition) => condition.value.trim().length > 0);

  useEffect(() => {
    if (!manualFormOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeManualForm();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [manualFormOpen, createTransactionMutation.isPending]);

  return (
    <section className="page">
      <h2>Transactions</h2>

      <Card title="Filters">
        <div className="transactions-filters-grid">
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

          <Input
            id="description-filter"
            label="Description"
            placeholder="Search description"
            value={filters.descriptionQuery ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, descriptionQuery: event.target.value || undefined, offset: 0 }))
            }
          />

          <Input
            id="merchant-filter"
            label="Merchant"
            placeholder="Search payee, description, or memo"
            value={filters.merchantQuery ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, merchantQuery: event.target.value || undefined, offset: 0 }))
            }
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
            value={filters.categoryId ?? (filters.uncategorized ? (uncategorizedCategory?.id ?? '') : '')}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => {
                if (value === '') {
                  return { ...prev, categoryId: undefined, uncategorized: undefined, offset: 0 };
                }
                return { ...prev, categoryId: Number(value), uncategorized: undefined, offset: 0 };
              });
            }}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            id="amount-operator-filter"
            label="Amount"
            value={filters.amountOperator ?? ''}
            onChange={(event) => {
              const value = event.target.value as AmountFilterOperator | '';
              setFilters((prev) => ({
                ...prev,
                amountOperator: value || undefined,
                amountValue: value ? prev.amountValue : undefined,
                offset: 0,
              }));
            }}
          >
            <option value="">Any amount</option>
            <option value="eq">Equals</option>
            <option value="gt">Greater than</option>
            <option value="lt">Less than</option>
          </Select>

          <Input
            id="amount-value-filter"
            label="Amount value"
            type="number"
            step="0.01"
            placeholder="e.g. 100.00"
            value={filters.amountValue ?? ''}
            disabled={!filters.amountOperator}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => ({
                ...prev,
                amountValue: value ? Number(value) : undefined,
                offset: 0,
              }));
            }}
          />

          <div className="field transactions-filters-transfers">
            <span className="field-label">Transfers</span>
            <label className="transactions-filters-checkbox" htmlFor="include-transfers">
              <input
                id="include-transfers"
                type="checkbox"
                checked={filters.includeTransfers}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, includeTransfers: event.target.checked, offset: 0 }))
                }
              />
              <span>Include internal transfers</span>
            </label>
          </div>
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

      <Card
        title="Unified Transactions"
        actions={
          <div className="transactions-card-actions">
            <Button
              type="button"
              onClick={openManualForm}
              disabled={createTransactionMutation.isPending || (accountsQuery.data?.length ?? 0) === 0}
            >
              Add transaction
            </Button>
            <div className="transactions-card-page-size">
              <Select
                id="unified-transactions-page-size"
                label="Items per page"
                value={String(filters.limit)}
                onChange={(event) => setUnifiedPageSize(event.target.value)}
              >
                {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
                  <option key={pageSizeOption} value={pageSizeOption}>
                    {pageSizeOption}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        }
      >
        {transactionsQuery.data && transactionsQuery.data.length > 0 ? (
          <>
            <div className="transactions-list" role="list" aria-label="Unified transactions">
              {transactionsQuery.data.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  categories={categoryOptions}
                  disabled={markTransferMutation.isPending || deleteMutation.isPending}
                  onCategoryChange={(transactionId, categoryId) =>
                    updateMutation.mutate({ id: transactionId, payload: { categoryId } })
                  }
                  onExcludeToggle={(transactionId, excludeFromTotals) =>
                    updateMutation.mutate({ id: transactionId, payload: { excludeFromTotals } })
                  }
                  onNotesChange={(transactionId, notes) => updateMutation.mutate({ id: transactionId, payload: { notes } })}
                  onAddRule={openRuleForm}
                  onMarkTransfer={(transactionId, pairId) => markTransferMutation.mutate({ id: transactionId, pairId })}
                  onDelete={(transactionId) => deleteMutation.mutate(transactionId)}
                />
              ))}
            </div>

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

      <Card
        title="Transfer Pairs"
        actions={
          <div style={{ width: '180px' }}>
            <Select id="transfer-pairs-page-size" label="Items per page" value={String(transferLimit)} onChange={(event) => setTransferPageSize(event.target.value)}>
              {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
                <option key={pageSizeOption} value={pageSizeOption}>
                  {pageSizeOption}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {transferPairCount > 0 ? (
          <>
            <div className="transfer-list" role="list" aria-label="Transfer pairs">
              {pagedTransferPairs.map((pair) => (
                <TransferPairRow
                  key={`${pair.fromTransactionId}-${pair.toTransactionId}`}
                  pair={pair}
                  onUnlink={(fromTransactionId) => unlinkMutation.mutate(fromTransactionId)}
                  disabled={unlinkMutation.isPending}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setTransferOffset((prev) => Math.max(0, prev - transferLimit))} disabled={transferOffset === 0}>
                Previous
              </Button>

              <Button
                variant="secondary"
                onClick={() => setTransferOffset((prev) => prev + transferLimit)}
                disabled={transferOffset + transferLimit >= transferPairCount}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <EmptyState title="No transfer pairs" description="Transfer pairs will appear here when transactions are linked as internal transfers." />
        )}
      </Card>

      {manualFormOpen && (
        <div className="modal-backdrop" onMouseDown={closeManualForm}>
          <div className="modal-shell" onMouseDown={(event) => event.stopPropagation()}>
            <Card
              title="Add Manual Transaction"
              actions={
                <Button type="button" variant="secondary" onClick={closeManualForm} disabled={createTransactionMutation.isPending}>
                  Close
                </Button>
              }
            >
              <form className="manual-transaction-form" onSubmit={submitManualForm}>
                <div className="manual-transaction-form-grid">
                  <Select
                    id="manual-transaction-account"
                    label="Account"
                    value={manualForm.accountId}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, accountId: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  >
                    <option value="">Select account</option>
                    {(accountsQuery.data ?? []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    id="manual-transaction-posted-date"
                    label="Posted date"
                    type="date"
                    value={manualForm.postedDate}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, postedDate: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Input
                    id="manual-transaction-transacted-date"
                    label="Transacted date"
                    type="date"
                    value={manualForm.transactedDate}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, transactedDate: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Input
                    id="manual-transaction-amount"
                    label="Amount"
                    type="number"
                    step="0.01"
                    value={manualForm.amount}
                    placeholder="-42.50 for expense, 1500 for income"
                    onChange={(event) => setManualForm((prev) => ({ ...prev, amount: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Input
                    id="manual-transaction-description"
                    label="Description"
                    value={manualForm.description}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, description: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Input
                    id="manual-transaction-payee"
                    label="Payee"
                    value={manualForm.payee}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, payee: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Input
                    id="manual-transaction-memo"
                    label="Memo"
                    value={manualForm.memo}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, memo: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  />

                  <Select
                    id="manual-transaction-category"
                    label="Category"
                    value={manualForm.categoryId}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    disabled={createTransactionMutation.isPending}
                  >
                    <option value="">Auto-assign (falls back to Uncategorized)</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>

                  <div className="field manual-transaction-checkbox">
                    <span className="field-label">Status</span>
                    <label htmlFor="manual-transaction-pending" className="transactions-filters-checkbox">
                      <input
                        id="manual-transaction-pending"
                        type="checkbox"
                        checked={manualForm.pending}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, pending: event.target.checked }))}
                        disabled={createTransactionMutation.isPending}
                      />
                      <span>Pending transaction</span>
                    </label>
                  </div>

                  <div className="field manual-transaction-checkbox">
                    <span className="field-label">Totals</span>
                    <label htmlFor="manual-transaction-exclude-from-totals" className="transactions-filters-checkbox">
                      <input
                        id="manual-transaction-exclude-from-totals"
                        type="checkbox"
                        checked={manualForm.excludeFromTotals}
                        onChange={(event) =>
                          setManualForm((prev) => ({ ...prev, excludeFromTotals: event.target.checked }))
                        }
                        disabled={createTransactionMutation.isPending}
                      />
                      <span>Exclude from totals</span>
                    </label>
                  </div>
                </div>

                <label className="field" htmlFor="manual-transaction-notes">
                  <span className="field-label">Notes</span>
                  <textarea
                    id="manual-transaction-notes"
                    className="input manual-transaction-notes"
                    value={manualForm.notes}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Optional details"
                    disabled={createTransactionMutation.isPending}
                  />
                </label>

                {manualFormError && <p className="field-error">{manualFormError}</p>}

                <div className="manual-transaction-actions">
                  <Button type="submit" disabled={createTransactionMutation.isPending}>
                    Save transaction
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeManualForm} disabled={createTransactionMutation.isPending}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

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
                  id="tx-rule-condition-operator"
                  label="Filter join"
                  value={ruleForm.conditionOperator}
                  onChange={(event) =>
                    setRuleForm((prev) =>
                      prev ? { ...prev, conditionOperator: event.target.value as RuleConditionOperator } : prev,
                    )
                  }
                >
                  <option value="AND">All filters must match (AND)</option>
                  <option value="OR">Any filter can match (OR)</option>
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

              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                {ruleForm.conditions.map((condition, index) => {
                  const availablePatternTypes = allowedPatternTypes(condition.field);

                  return (
                    <div
                      key={`tx-rule-condition-${index}`}
                      style={{
                        display: 'grid',
                        gap: '0.5rem',
                        gridTemplateColumns: '1.25fr 1.25fr 2fr auto',
                        alignItems: 'end',
                      }}
                    >
                      <Select
                        id={`tx-rule-condition-field-${index}`}
                        label={index === 0 ? 'Field' : ''}
                        value={condition.field}
                        onChange={(event) => setRuleConditionField(index, event.target.value as RuleMatchField)}
                      >
                        <option value="DESCRIPTION">Description</option>
                        <option value="PAYEE">Payee</option>
                        <option value="MEMO">Memo</option>
                        <option value="ACCOUNT">Account</option>
                        <option value="AMOUNT">Amount</option>
                      </Select>

                      <Select
                        id={`tx-rule-condition-pattern-type-${index}`}
                        label={index === 0 ? 'Operator' : ''}
                        value={condition.patternType}
                        onChange={(event) => setRuleConditionPatternType(index, event.target.value as RulePatternType)}
                      >
                        {availablePatternTypes.map((patternType) => (
                          <option key={patternType} value={patternType}>
                            {patternTypeLabelByValue[patternType]}
                          </option>
                        ))}
                      </Select>

                      {condition.field === 'ACCOUNT' ? (
                        <Select
                          id={`tx-rule-condition-value-${index}`}
                          label={index === 0 ? 'Value' : ''}
                          value={condition.value}
                          onChange={(event) => setRuleConditionValue(index, event.target.value)}
                        >
                          <option value="">Select account</option>
                          {(accountsQuery.data ?? []).map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={`tx-rule-condition-value-${index}`}
                          label={index === 0 ? 'Value' : ''}
                          type={condition.field === 'AMOUNT' ? 'number' : 'text'}
                          step={condition.field === 'AMOUNT' ? '0.01' : undefined}
                          value={condition.value}
                          placeholder={condition.field === 'AMOUNT' ? '-250.00' : 'Match value'}
                          onChange={(event) => setRuleConditionValue(index, event.target.value)}
                        />
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => removeRuleCondition(index)}
                        disabled={ruleForm.conditions.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}

                <div>
                  <Button type="button" variant="ghost" onClick={addRuleCondition}>
                    Add filter
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button
                  type="button"
                  onClick={submitRule}
                  disabled={createRuleMutation.isPending || !isRuleFormValid}
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
