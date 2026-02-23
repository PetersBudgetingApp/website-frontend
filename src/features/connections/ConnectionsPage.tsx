import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAccountSummary } from '@shared/api/endpoints/accounts';
import { deleteConnection, getConnections, setupSimpleFinConnection, syncConnection } from '@shared/api/endpoints/connections';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';
import { EmptyState } from '@shared/ui/EmptyState';
import { formatDate } from '@domain/format';

const setupSchema = z.object({
  setupToken: z.string().min(1, 'Setup token is required'),
});

type SetupForm = z.infer<typeof setupSchema>;

type SyncStatus = { state: 'syncing' | 'success' | 'error'; connectionId: number; message?: string };

export function ConnectionsPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
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
      syncMutation.mutate(data.id);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => {
      setSyncStatus({ state: 'syncing', connectionId: id });
      return syncConnection(id);
    },
    onSuccess: (result, id) => {
      setSyncStatus({ state: 'success', connectionId: id, message: result.message });
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all() });
    },
    onError: (_err, id) => {
      setSyncStatus({ state: 'error', connectionId: id, message: 'Sync failed. Please try again.' });
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

  return (
    <section className="page">
      <h2>Connections</h2>

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

      <Card title="Account Snapshot">
        {summaryQuery.data ? (
          <div className="grid-cards">
            <div>
              <p className="subtle">Assets</p>
              <p className="number">{summaryQuery.data.totalAssets.toFixed(2)}</p>
            </div>
            <div>
              <p className="subtle">Liabilities</p>
              <p className="number">{summaryQuery.data.totalLiabilities.toFixed(2)}</p>
            </div>
            <div>
              <p className="subtle">Net Worth</p>
              <p className="number">{summaryQuery.data.netWorth.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="subtle">No account data yet.</p>
        )}
      </Card>

      <Card title="Linked Institutions">
        {syncStatus?.state === 'syncing' && (
          <div className="sync-banner sync-banner--info">
            <span className="spinner" /> Syncing transactions… This may take a moment.
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

        {connectionsQuery.data && connectionsQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Status</th>
                <th>Accounts</th>
                <th>Last Sync</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connectionsQuery.data.map((connection) => {
                const isSyncingThis = syncStatus?.state === 'syncing' && syncStatus.connectionId === connection.id;
                return (
                <tr key={connection.id}>
                  <td>{connection.institutionName ?? 'Unknown Institution'}</td>
                  <td>
                    {isSyncingThis ? (
                      <span className="sync-status-pill sync-status-pill--syncing">
                        <span className="spinner" /> Syncing
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
                        onClick={() => syncMutation.mutate(connection.id)}
                        disabled={syncMutation.isPending}
                      >
                        {isSyncingThis ? 'Syncing…' : 'Sync'}
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
    </section>
  );
}
