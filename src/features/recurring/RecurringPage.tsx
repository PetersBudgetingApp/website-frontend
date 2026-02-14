import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@domain/format';
import { buildTransactionsPath } from '@features/transactions/transactionRouteFilters';
import {
  deleteRecurringPattern,
  detectRecurringPatterns,
  getRecurringPatterns,
  getUpcomingBills,
  toggleRecurringActive,
} from '@shared/api/endpoints/recurring';
import { queryKeys } from '@shared/query/keys';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';

export function RecurringPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const patternsQuery = useQuery({
    queryKey: queryKeys.recurring.all(),
    queryFn: getRecurringPatterns,
  });

  const upcomingQuery = useQuery({
    queryKey: queryKeys.recurring.upcoming(),
    queryFn: getUpcomingBills,
  });

  const detectMutation = useMutation({
    mutationFn: detectRecurringPatterns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.upcoming() });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => toggleRecurringActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.upcoming() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurringPattern,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.upcoming() });
    },
  });

  const patterns = patternsQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];

  if (patternsQuery.isLoading || upcomingQuery.isLoading) {
    return (
      <section className="page">
        <h2>Recurring Bills</h2>
        <p>Loading recurring data...</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Recurring Bills</h2>

      <Card
        title="Recurring Patterns"
        actions={
          <Button variant="secondary" onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending}>
            {detectMutation.isPending ? 'Detecting...' : 'Detect Now'}
          </Button>
        }
      >
        {patterns.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Next Expected</th>
                <th>Category</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern) => (
                <tr
                  key={pattern.id}
                  className="table-clickable-row"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(buildTransactionsPath({ merchantQuery: pattern.merchantPattern?.trim() || pattern.name }))
                  }
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return;
                    }
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(buildTransactionsPath({ merchantQuery: pattern.merchantPattern?.trim() || pattern.name }));
                    }
                  }}
                >
                  <td>{pattern.name}</td>
                  <td className="number">{formatCurrency(pattern.expectedAmount)}</td>
                  <td>{pattern.frequency}</td>
                  <td>{formatDate(pattern.nextExpectedDate)}</td>
                  <td>{pattern.category?.name ?? <span className="subtle">None</span>}</td>
                  <td>
                    <Button
                      variant={pattern.active ? 'primary' : 'ghost'}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMutation.mutate({ id: pattern.id, active: !pattern.active });
                      }}
                      disabled={toggleMutation.isPending}
                    >
                      {pattern.active ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteMutation.mutate(pattern.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No recurring patterns" description="Click Detect Now to scan your transactions for recurring patterns." />
        )}
      </Card>

      <Card title="Upcoming Bills">
        {upcoming.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Days Until Due</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((bill) => (
                <tr
                  key={bill.patternId}
                  className="table-clickable-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(buildTransactionsPath({ merchantQuery: bill.name }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(buildTransactionsPath({ merchantQuery: bill.name }));
                    }
                  }}
                >
                  <td>{bill.name}</td>
                  <td className="number">{formatCurrency(bill.expectedAmount)}</td>
                  <td>{formatDate(bill.dueDate)}</td>
                  <td className="number">{bill.daysUntilDue}</td>
                  <td>{bill.category?.name ?? <span className="subtle">None</span>}</td>
                  <td>{bill.overdue ? <Badge>Overdue</Badge> : <span className="subtle">Upcoming</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No upcoming bills" description="Upcoming bills will appear here once recurring patterns are detected." />
        )}
      </Card>
    </section>
  );
}
