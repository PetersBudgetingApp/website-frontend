import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAccount,
  getAccountSummary,
  type AccountCreateRequestDto,
  type AccountSummaryDto,
} from '@shared/api/endpoints/accounts';
import {
  deleteConnection,
  fullSyncConnection,
  getConnections,
  setupSimpleFinConnection,
  syncConnection,
} from '@shared/api/endpoints/connections';
import { ApiClientError } from '@shared/api/httpClient';
import { formatCurrency, formatDate } from '@domain/format';
import type { NetWorthCategory } from '@domain/types';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { NetWorthBreakdownCard } from '@features/dashboard/components/NetWorthBreakdownCard';

const setupSchema = z.object({
  setupToken: z.string().min(1, 'Setup token is required'),
});

type SetupForm = z.infer<typeof setupSchema>;
type AccountsTab = 'connections' | 'accounts';
type AccountTypeFilter = 'ANY' | NetWorthCategory;
type SyncMode = 'incremental' | 'full';
type SyncAction = { connectionId: number; mode: SyncMode };
type SyncStatus = { state: 'syncing' | 'success' | 'error'; connectionId: number; mode: SyncMode; message?: string };

interface AccountFormState {
  name: string;
  institutionName: string;
  netWorthCategory: NetWorthCategory;
  currentBalance: string;
  currency: string;
}

function getInstitutionName(input?: string | null): string {
  const trimmed = input?.trim();
  return trimmed ? trimmed : 'Unknown institution';
}

function getDefaultCurrency(summary?: AccountSummaryDto): string {
  const accounts = summary?.accounts ?? [];
  if (accounts.length === 0) {
    return 'USD';
  }

  const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];
  const currency = randomAccount?.currency?.trim();
  return currency ? currency.toUpperCase() : 'USD';
}

function getDefaultAccountForm(summary?: AccountSummaryDto): AccountFormState {
  return {
    name: '',
    institutionName: 'User Added',
    netWorthCategory: 'BANK_ACCOUNT',
    currentBalance: '0',
    currency: getDefaultCurrency(summary),
  };
}

function toFilteredSummary(summary: AccountSummaryDto, typeFilter: AccountTypeFilter, institutionFilter: string): AccountSummaryDto {
  const filteredAccounts = summary.accounts.filter((account) => {
    if (typeFilter !== 'ANY' && account.netWorthCategory !== typeFilter) {
      return false;
    }

    if (institutionFilter !== 'ANY' && getInstitutionName(account.institutionName) !== institutionFilter) {
      return false;
    }

    return true;
  });

  let totalAssets = 0;
  let totalLiabilities = 0;

  filteredAccounts.forEach((account) => {
    if (account.netWorthCategory === 'LIABILITY') {
      totalLiabilities += Math.abs(account.currentBalance);
      return;
    }

    totalAssets += account.currentBalance;
  });

  return {
    ...summary,
    accounts: filteredAccounts,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

export function AccountsPage() {
  const [activeTab, setActiveTab] = useState<AccountsTab>('connections');
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountTypeFilter>('ANY');
  const [institutionFilter, setInstitutionFilter] = useState('ANY');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(getDefaultAccountForm);
  const [accountFormError, setAccountFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const setupForm = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      setupToken: '',
    },
  });

  const connectionsQuery = useQuery({
    queryKey: queryKeys.connections.all(),
    queryFn: getConnections,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.accounts.summary(),
    queryFn: getAccountSummary,
  });

  const setupMutation = useMutation({
    mutationFn: (values: SetupForm) => setupSimpleFinConnection(values.setupToken),
    onSuccess: (data) => {
      setupForm.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      syncMutation.mutate({ connectionId: data.id, mode: 'incremental' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (action: SyncAction) => {
      setSyncStatus({ state: 'syncing', connectionId: action.connectionId, mode: action.mode });
      return action.mode === 'full' ? fullSyncConnection(action.connectionId) : syncConnection(action.connectionId);
    },
    onSuccess: (result, action) => {
      setSyncStatus({ state: 'success', connectionId: action.connectionId, mode: action.mode, message: result.message });
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
    onError: (_err, action) => {
      const message = action.mode === 'full'
        ? 'Full sync failed. Ensure all institutions are authenticated, then try again.'
        : 'Sync failed. Please try again.';
      setSyncStatus({ state: 'error', connectionId: action.connectionId, mode: action.mode, message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      setSyncStatus(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (payload: AccountCreateRequestDto) => createAccount(payload),
    onSuccess: () => {
      setAccountFormOpen(false);
      setAccountForm(getDefaultAccountForm(summaryQuery.data));
      setAccountFormError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        if (error.errors && Object.keys(error.errors).length > 0) {
          setAccountFormError(Object.values(error.errors).join(' '));
          return;
        }
        setAccountFormError(error.message);
        return;
      }
      setAccountFormError('Unable to create account. Please try again.');
    },
  });

  const filteredSummary = useMemo(() => {
    if (!summaryQuery.data) {
      return null;
    }

    return toFilteredSummary(summaryQuery.data, accountTypeFilter, institutionFilter);
  }, [summaryQuery.data, accountTypeFilter, institutionFilter]);

  const institutionOptions = useMemo(() => {
    const uniqueInstitutions = new Set<string>();
    (summaryQuery.data?.accounts ?? []).forEach((account) => {
      uniqueInstitutions.add(getInstitutionName(account.institutionName));
    });
    return Array.from(uniqueInstitutions).sort((a, b) => a.localeCompare(b));
  }, [summaryQuery.data]);

  useEffect(() => {
    if (institutionFilter === 'ANY') {
      return;
    }

    if (!institutionOptions.includes(institutionFilter)) {
      setInstitutionFilter('ANY');
    }
  }, [institutionFilter, institutionOptions]);

  useEffect(() => {
    if (!accountFormOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (createAccountMutation.isPending) {
          return;
        }
        setAccountFormOpen(false);
        setAccountFormError(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [accountFormOpen, createAccountMutation.isPending]);

  const confirmAndRunFullSync = (connectionId: number) => {
    const confirmed = window.confirm(
      'Full Sync can take longer because it reconciles historical transactions. Before starting, make sure all institutions are authenticated in SimpleFIN so no history is skipped. Continue?',
    );
    if (!confirmed) {
      return;
    }
    syncMutation.mutate({ connectionId, mode: 'full' });
  };

  const openAccountForm = () => {
    setAccountForm(getDefaultAccountForm(summaryQuery.data));
    setAccountFormError(null);
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    if (createAccountMutation.isPending) {
      return;
    }

    setAccountFormOpen(false);
    setAccountFormError(null);
  };

  const submitAccountForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountFormError(null);

    const name = accountForm.name.trim();
    if (!name) {
      setAccountFormError('Account name is required.');
      return;
    }

    const rawCurrentBalance = accountForm.currentBalance.trim();
    const currentBalance = rawCurrentBalance.length === 0 ? 0 : Number(rawCurrentBalance);
    if (!Number.isFinite(currentBalance)) {
      setAccountFormError('Current balance must be a valid number.');
      return;
    }

    const currency = accountForm.currency.trim().toUpperCase();
    if (currency && currency.length !== 3) {
      setAccountFormError('Currency must be exactly 3 letters.');
      return;
    }

    createAccountMutation.mutate({
      name,
      institutionName: accountForm.institutionName.trim() || undefined,
      netWorthCategory: accountForm.netWorthCategory,
      currentBalance,
      currency: currency || undefined,
    });
  };

  return (
    <section className="page">
      <h2>Accounts</h2>

      <div className="chart-toggle" role="group" aria-label="Accounts view">
        <button
          type="button"
          className={`btn ${activeTab === 'connections' ? 'btn-primary' : 'btn-secondary'} chart-toggle-btn`}
          onClick={() => setActiveTab('connections')}
          aria-pressed={activeTab === 'connections'}
        >
          Connections
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-secondary'} chart-toggle-btn`}
          onClick={() => setActiveTab('accounts')}
          aria-pressed={activeTab === 'accounts'}
        >
          Accounts
        </button>
      </div>

      <Card title="Account Snapshot">
        {summaryQuery.isLoading ? (
          <p className="subtle">Loading account data...</p>
        ) : summaryQuery.data ? (
          <div className="grid-cards">
            <div>
              <p className="subtle">Assets</p>
              <p className="number">{formatCurrency(summaryQuery.data.totalAssets)}</p>
            </div>
            <div>
              <p className="subtle">Liabilities</p>
              <p className="number">{formatCurrency(summaryQuery.data.totalLiabilities)}</p>
            </div>
            <div>
              <p className="subtle">Net Worth</p>
              <p className="number">{formatCurrency(summaryQuery.data.netWorth)}</p>
            </div>
          </div>
        ) : (
          <p className="subtle">No account data yet.</p>
        )}
      </Card>

      {activeTab === 'connections' ? (
        <>
          <Card title="Connect Bank via SimpleFIN">
            <form className="form-grid" onSubmit={setupForm.handleSubmit((values) => setupMutation.mutate(values))}>
              <Input
                id="setup-token"
                label="SimpleFIN Setup Token"
                placeholder="Paste setup token"
                error={setupForm.formState.errors.setupToken?.message}
                {...setupForm.register('setupToken')}
              />

              <Button type="submit" disabled={setupMutation.isPending}>
                {setupMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>

              {setupMutation.error && <p className="field-error">Could not connect account.</p>}
            </form>
          </Card>

          <Card title="SimpleFIN Connections">
            {syncStatus?.state === 'syncing' && (
              <div className="sync-banner sync-banner--info">
                <span className="spinner" />
                {syncStatus.mode === 'full'
                  ? ' Running full sync… This can take longer while history is reconciled.'
                  : ' Syncing transactions… This may take a moment.'}
              </div>
            )}
            {syncStatus?.state === 'success' && (
              <div className="sync-banner sync-banner--success">
                ✓ {syncStatus.message}
                <button className="sync-banner-dismiss" onClick={() => setSyncStatus(null)}>✕</button>
              </div>
            )}
            {syncStatus?.state === 'error' && (
              <div className="sync-banner sync-banner--error">
                ✗ {syncStatus.message}
                <button className="sync-banner-dismiss" onClick={() => setSyncStatus(null)}>✕</button>
              </div>
            )}
            <p className="subtle">
              Full Sync fetches and reconciles historical transactions. Before running it, make sure all institutions are
              authenticated in SimpleFIN so no history is skipped.
            </p>

            {connectionsQuery.data && connectionsQuery.data.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Accounts</th>
                    <th>Last Sync</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connectionsQuery.data.map((connection) => {
                    const isSyncingThis = syncStatus?.state === 'syncing' && syncStatus.connectionId === connection.id;
                    const isFullSyncingThis = isSyncingThis && syncStatus?.mode === 'full';
                    return (
                      <tr key={connection.id}>
                        <td>
                          {isSyncingThis ? (
                            <span className="sync-status-pill sync-status-pill--syncing">
                              <span className="spinner" /> {isFullSyncingThis ? 'Full syncing' : 'Syncing'}
                            </span>
                          ) : (
                            <span className={`sync-status-pill sync-status-pill--${connection.syncStatus.toLowerCase()}`}>
                              {connection.syncStatus === 'SUCCESS' && '✓ '}
                              {connection.syncStatus === 'FAILED' && '✗ '}
                              {connection.syncStatus}
                            </span>
                          )}
                        </td>
                        <td>{connection.accountCount}</td>
                        <td>{formatDate(connection.lastSyncAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <Button
                              variant="secondary"
                              onClick={() => syncMutation.mutate({ connectionId: connection.id, mode: 'incremental' })}
                              disabled={syncMutation.isPending}
                            >
                              {isSyncingThis && !isFullSyncingThis ? 'Syncing…' : 'Sync'}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => confirmAndRunFullSync(connection.id)}
                              disabled={syncMutation.isPending}
                            >
                              {isFullSyncingThis ? 'Full syncing…' : 'Full Sync'}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => deleteMutation.mutate(connection.id)}
                              disabled={deleteMutation.isPending || isSyncingThis}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No connections" description="Add a SimpleFIN token to connect your institutions." />
            )}
          </Card>
        </>
      ) : (
        <>
          {filteredSummary ? (
            <NetWorthBreakdownCard
              summary={filteredSummary}
              title="Your Connected Accounts"
              actions={
                <Button type="button" onClick={openAccountForm} disabled={createAccountMutation.isPending}>
                  Add account
                </Button>
              }
              controls={
                <div className="accounts-breakdown-filters">
                  <Select
                    id="accounts-type-filter"
                    label="Filter by type"
                    value={accountTypeFilter}
                    onChange={(event) => setAccountTypeFilter(event.target.value as AccountTypeFilter)}
                  >
                    <option value="ANY">Any</option>
                    <option value="BANK_ACCOUNT">Bank Accounts</option>
                    <option value="INVESTMENT">Investments</option>
                    <option value="LIABILITY">Liabilities</option>
                  </Select>

                  <Select
                    id="accounts-institution-filter"
                    label="Filter by institution"
                    value={institutionFilter}
                    onChange={(event) => setInstitutionFilter(event.target.value)}
                  >
                    <option value="ANY">Any</option>
                    {institutionOptions.map((institutionName) => (
                      <option key={institutionName} value={institutionName}>
                        {institutionName}
                      </option>
                    ))}
                  </Select>
                </div>
              }
            />
          ) : (
            <Card
              title="Your Connected Accounts"
              actions={<Button type="button" onClick={openAccountForm}>Add account</Button>}
            >
              <p className="subtle">No account data yet.</p>
            </Card>
          )}

          {accountFormOpen && (
            <div className="modal-backdrop" onMouseDown={closeAccountForm}>
              <div className="modal-shell" onMouseDown={(event) => event.stopPropagation()}>
                <Card
                  title="Add Account"
                  actions={
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeAccountForm}
                      disabled={createAccountMutation.isPending}
                    >
                      Close
                    </Button>
                  }
                >
                  <form className="manual-transaction-form" onSubmit={submitAccountForm}>
                    <div className="manual-transaction-form-grid accounts-create-form-grid">
                      <Input
                        id="create-account-name"
                        label="Account Name"
                        value={accountForm.name}
                        onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                        disabled={createAccountMutation.isPending}
                        required
                      />

                      <Input
                        id="create-account-institution"
                        label="Institution"
                        value={accountForm.institutionName}
                        onChange={(event) => setAccountForm((prev) => ({ ...prev, institutionName: event.target.value }))}
                        disabled={createAccountMutation.isPending}
                      />

                      <Select
                        id="create-account-net-worth-category"
                        label="Net Worth Category"
                        value={accountForm.netWorthCategory}
                        onChange={(event) =>
                          setAccountForm((prev) => ({ ...prev, netWorthCategory: event.target.value as NetWorthCategory }))
                        }
                        disabled={createAccountMutation.isPending}
                      >
                        <option value="BANK_ACCOUNT">Bank Account</option>
                        <option value="INVESTMENT">Investment</option>
                        <option value="LIABILITY">Liability</option>
                      </Select>

                      <Input
                        id="create-account-current-balance"
                        label="Current Balance"
                        type="number"
                        step="0.01"
                        value={accountForm.currentBalance}
                        onChange={(event) => setAccountForm((prev) => ({ ...prev, currentBalance: event.target.value }))}
                        disabled={createAccountMutation.isPending}
                      />

                      <Input
                        id="create-account-currency"
                        label="Currency"
                        value={accountForm.currency}
                        maxLength={3}
                        onChange={(event) => {
                          const normalized = event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                          setAccountForm((prev) => ({ ...prev, currency: normalized }));
                        }}
                        disabled={createAccountMutation.isPending}
                      />
                    </div>

                    <p className="subtle">Currency must be a 3-letter code, like USD.</p>
                    {accountFormError && <p className="field-error">{accountFormError}</p>}

                    <div className="manual-transaction-actions">
                      <Button type="submit" disabled={createAccountMutation.isPending}>
                        {createAccountMutation.isPending ? 'Saving...' : 'Save account'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={closeAccountForm}
                        disabled={createAccountMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
