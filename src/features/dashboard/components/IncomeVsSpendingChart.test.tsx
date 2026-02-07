import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IncomeVsSpendingChart } from '@features/dashboard/components/IncomeVsSpendingChart';

const sampleTrends = [
  { month: '2025-11', income: 5000, expenses: 3200, transfers: 0, netCashFlow: 1800 },
  { month: '2025-12', income: 5200, expenses: 3400, transfers: 0, netCashFlow: 1800 },
  { month: '2026-01', income: 4900, expenses: 3600, transfers: 0, netCashFlow: 1300 },
];

describe('IncomeVsSpendingChart', () => {
  it('renders bar chart mode by default', () => {
    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} />);

    expect(screen.getByRole('button', { name: 'Bar Chart' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Monthly income and spending bar chart' })).toBeInTheDocument();
  });

  it('toggles to cumulative line chart mode', async () => {
    const user = userEvent.setup();
    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} />);

    await user.click(screen.getByRole('button', { name: 'Cumulative Line' }));

    expect(screen.getByRole('button', { name: 'Cumulative Line' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Cumulative income and spending line chart' })).toBeInTheDocument();
  });

  it('renders an empty state when trend data is unavailable', () => {
    render(<IncomeVsSpendingChart trends={[]} isLoading={false} isError={false} />);

    expect(screen.getByText('No trend data yet')).toBeInTheDocument();
  });
});
