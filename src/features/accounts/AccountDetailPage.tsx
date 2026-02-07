import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/query/keys';
import { getAccount } from '@shared/api/endpoints/accounts';
import { getTransactions } from '@shared/api/endpoints/transactions';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';
import { formatCurrency, formatDate } from '@domain/format';
import type { TransactionFilters } from '@domain/types';
import { appRoutes } from '@app/routes';

const PAGE_SIZE = 20;

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);

  const [offset, setOffset] = useState(0);

  const accountQuery = useQuery({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () => getAccount(accountId),
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

  return (
    <section className="page">
      <p style={{ marginBottom: '0.5rem' }}>
        <Link to={appRoutes.dashboard}>&larr; Back to Dashboard</Link>
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
    </section>
  );
}
