import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteConnection, getConnections, getAccountSummary, setupSimpleFinConnection, syncConnection } from '@shared/api/endpoints';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';
import { EmptyState } from '@shared/ui/EmptyState';
import { formatDate } from '@domain/format';

const setupSchema = z.object({
  setupToken: z.string().min(1, 'Setup token is required'),
});

type SetupForm = z.infer<typeof setupSchema>;

export function ConnectionsPage() {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const setupForm = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      setupToken: '',
    },
  });

  const connectionsQuery = useQuery({
    queryKey: ['connections'],
    queryFn: getConnections,
  });

  const summaryQuery = useQuery({
    queryKey: ['accounts', 'summary'],
    queryFn: getAccountSummary,
  });

  const setupMutation = useMutation({
    mutationFn: (values: SetupForm) => setupSimpleFinConnection(values.setupToken),
    onSuccess: () => {
      setupForm.reset();
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncConnection,
    onSuccess: (result) => {
      setSyncMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
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
        {syncMessage && <p>{syncMessage}</p>}

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
              {connectionsQuery.data.map((connection) => (
                <tr key={connection.id}>
                  <td>{connection.institutionName ?? 'Unknown Institution'}</td>
                  <td>{connection.syncStatus}</td>
                  <td>{connection.accountCount}</td>
                  <td>{formatDate(connection.lastSyncAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Button variant="secondary" onClick={() => syncMutation.mutate(connection.id)} disabled={syncMutation.isPending}>
                        Sync
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => deleteMutation.mutate(connection.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No connections" description="Add a SimpleFIN token to connect your institutions." />
        )}
      </Card>
    </section>
  );
}
