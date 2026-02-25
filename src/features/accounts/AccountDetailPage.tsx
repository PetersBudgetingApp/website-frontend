import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appRoutes } from '@app/routes';
import type { NetWorthCategory, TransactionFilters } from '@domain/types';
import {
  deleteAccount,
  getAccount,
  getAccountDeletionPreview,
  updateAccountNetWorthCategory,
} from '@shared/api/endpoints/accounts';
import { getTransactions } from '@shared/api/endpoints/transactions';
import { ApiClientError } from '@shared/api/httpClient';
import { queryKeys } from '@shared/query/keys';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { Spinner } from '@shared/ui/Spinner';
import { formatCurrency, formatDate } from '@domain/format';

const PAGE_SIZE = 20;
const DELETE_CONFIRMATION_TEXT = 'Delete this account';

const NET_WORTH_CATEGORY_LABELS: Record<NetWorthCategory, string> = {
  BANK_ACCOUNT: 'Bank Accounts',
  INVESTMENT: 'Investments',
  LIABILITY: 'Liabilities',
};

interface AccountDetailLocationState {
  from?: string;
  tab?: 'connections' | 'accounts';
  returnToDashboard?: boolean;
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as AccountDetailLocationState | null) ?? null;
  const queryClient = useQueryClient();

  const [offset, setOffset] = useState(0);
  const [selectedNetWorthCategory, setSelectedNetWorthCategory] = useState<NetWorthCategory | ''>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleteModeEnabled, setDeleteModeEnabled] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const accountQuery = useQuery({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () => getAccount(accountId),
    enabled: !Number.isNaN(accountId),
  });

  const deletionPreviewQuery = useQuery({
    queryKey: queryKeys.accounts.deletionPreview(accountId),
    queryFn: () => getAccountDeletionPreview(accountId),
    enabled: !Number.isNaN(accountId),
  });

  const filters: TransactionFilters = {
    includeTransfers: true,
    accountId,
    limit: PAGE_SIZE,
    offset,
  };

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => getTransactions(filters),
    enabled: !Number.isNaN(accountId),
  });

  useEffect(() => {
    if (accountQuery.data?.netWorthCategory) {
      setSelectedNetWorthCategory(accountQuery.data.netWorthCategory);
    }
  }, [accountQuery.data?.netWorthCategory]);

  const updateCategoryMutation = useMutation({
    mutationFn: (netWorthCategory: NetWorthCategory) => updateAccountNetWorthCategory(accountId, netWorthCategory),
    onSuccess: (updatedAccount) => {
      queryClient.setQueryData(queryKeys.accounts.detail(accountId), updatedAccount);
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      setSelectedNetWorthCategory(updatedAccount.netWorthCategory);
      setSaveMessage(`Saved as ${NET_WORTH_CATEGORY_LABELS[updatedAccount.netWorthCategory]}.`);
    },
    onError: () => {
      setSaveMessage('Could not save account category. Please try again.');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(accountId),
    onSuccess: () => {
      const nextState = {
        tab: 'accounts' as const,
        ...(locationState?.returnToDashboard ? { from: appRoutes.dashboard } : {}),
      };

      navigate(appRoutes.accounts, {
        replace: true,
        state: nextState,
      });

      queryClient.removeQueries({ queryKey: queryKeys.accounts.detail(accountId) });
      queryClient.removeQueries({ queryKey: queryKeys.accounts.deletionPreview(accountId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.coverage() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setDeleteError(error.message);
        return;
      }
      setDeleteError('Unable to delete account. Please try again.');
    },
  });

  if (Number.isNaN(accountId)) {
    return (
      <section className="page">
        <h2>Account</h2>
        <EmptyState title="Invalid account" description="The account ID in the URL is not valid." />
      </section>
    );
  }

  if (accountQuery.isLoading) {
    return (
      <section className="page">
        <h2>Account</h2>
        <Spinner />
      </section>
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <section className="page">
        <h2>Account</h2>
        <EmptyState title="Could not load account" description="The account may not exist or there was a network error." />
      </section>
    );
  }

  const account = accountQuery.data;
  const activeNetWorthCategory = selectedNetWorthCategory === '' ? account.netWorthCategory : selectedNetWorthCategory;
  const canSaveCategory = activeNetWorthCategory !== account.netWorthCategory;
  const cameFromAccounts = locationState?.from === appRoutes.accounts;
  const backTarget = cameFromAccounts ? appRoutes.accounts : appRoutes.dashboard;
  const backState = cameFromAccounts
    ? {
      tab: locationState?.tab === 'connections' ? 'connections' : 'accounts',
      ...(locationState?.returnToDashboard ? { from: appRoutes.dashboard } : {}),
    }
    : undefined;
  const backLabel = cameFromAccounts ? 'Back to Accounts' : 'Back to Dashboard';
  const deletionPreview = deletionPreviewQuery.data;

  return (
    <section className="page">
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to={backTarget} state={backState}>&larr; {backLabel}</Link>
      </p>
      <h2>{account.name}</h2>

      <Card title="Account Information">
        <div className="form-grid">
          <div>
            <p className="subtle">Institution</p>
            <p>{account.institutionName ?? 'N/A'}</p>
          </div>
          <div>
            <p className="subtle">Account Type</p>
            <p><Badge>{account.accountType}</Badge></p>
          </div>
          <div>
            <Select
              id="net-worth-category"
              label="Net Worth Category"
              value={activeNetWorthCategory}
              onChange={(event) => {
                setSelectedNetWorthCategory(event.target.value as NetWorthCategory);
                setSaveMessage(null);
              }}
            >
              <option value="BANK_ACCOUNT">{NET_WORTH_CATEGORY_LABELS.BANK_ACCOUNT}</option>
              <option value="INVESTMENT">{NET_WORTH_CATEGORY_LABELS.INVESTMENT}</option>
              <option value="LIABILITY">{NET_WORTH_CATEGORY_LABELS.LIABILITY}</option>
            </Select>
            <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                disabled={!canSaveCategory || updateCategoryMutation.isPending}
                onClick={() => {
                  updateCategoryMutation.mutate(activeNetWorthCategory);
                }}
              >
                {updateCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
              </Button>
              {saveMessage && (
                <p className={updateCategoryMutation.isError ? 'field-error' : 'subtle'}>{saveMessage}</p>
              )}
            </div>
          </div>
          <div>
            <p className="subtle">Currency</p>
            <p>{account.currency}</p>
          </div>
          <div>
            <p className="subtle">Current Balance</p>
            <p className="number">{formatCurrency(account.currentBalance, account.currency)}</p>
          </div>
          {account.availableBalance != null && (
            <div>
              <p className="subtle">Available Balance</p>
              <p className="number">{formatCurrency(account.availableBalance, account.currency)}</p>
            </div>
          )}
          <div>
            <p className="subtle">Last Balance Update</p>
            <p>{formatDate(account.balanceUpdatedAt)}</p>
          </div>
          <div>
            <p className="subtle">Status</p>
            <p><Badge>{account.active ? 'Active' : 'Inactive'}</Badge></p>
          </div>
        </div>
      </Card>

      <Card title="Recent Transactions">
        {transactionsQuery.isLoading ? (
          <Spinner />
        ) : transactionsQuery.isError ? (
          <EmptyState title="Could not load transactions" description="Try refreshing the page." />
        ) : !transactionsQuery.data || transactionsQuery.data.length === 0 ? (
          <EmptyState title="No transactions" description="No transactions found for this account." />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {transactionsQuery.data.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.postedAt)}</td>
                    <td>{tx.description ?? tx.payee ?? 'N/A'}</td>
                    <td className="number">{formatCurrency(tx.amount, account.currency)}</td>
                    <td>{tx.category?.name ?? 'Uncategorized'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={transactionsQuery.data.length < PAGE_SIZE}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </Card>

      {deletionPreview?.canDelete && (
        <Card title="Delete Account">
          <p className="subtle" style={{ marginBottom: '0.8rem' }}>
            Deleting this account will also delete {deletionPreview.transactionCount} associated {deletionPreview.transactionCount === 1 ? 'transaction' : 'transactions'}.
          </p>

          {!deleteModeEnabled ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setDeleteModeEnabled(true);
                  setDeleteInput('');
                  setDeleteError(null);
                }}
              >
              Delete account
            </Button>
          ) : (
            <div className="form-grid" style={{ maxWidth: '480px' }}>
              <Input
                id="delete-account-confirmation"
                label="Type confirmation"
                placeholder={DELETE_CONFIRMATION_TEXT}
                value={deleteInput}
                onChange={(event) => setDeleteInput(event.target.value)}
                disabled={deleteAccountMutation.isPending}
              />

              {deleteError && <p className="field-error">{deleteError}</p>}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="danger"
                  disabled={deleteInput !== DELETE_CONFIRMATION_TEXT || deleteAccountMutation.isPending}
                  onClick={() => deleteAccountMutation.mutate()}
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Confirm delete'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => {
                    setDeleteModeEnabled(false);
                    setDeleteInput('');
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </section>
  );
}
