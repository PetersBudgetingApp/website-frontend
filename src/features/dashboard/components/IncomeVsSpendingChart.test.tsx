import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('does not show a tooltip by default', () => {
    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} />);

    expect(document.querySelector('.trend-hover-group')).not.toBeInTheDocument();
  });

  it('shows a tooltip with values when hovering over the bar chart', () => {
    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} />);

    const svg = screen.getByRole('img', { name: 'Monthly income and spending bar chart' });
    // Mock getBoundingClientRect so coordinate math resolves to a valid data point
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 920, height: 320, right: 920, bottom: 320, x: 0, y: 0, toJSON: () => ({}) });

    // Hover over a point roughly in the first third of the chart (first data point region)
    fireEvent.mouseMove(svg, { clientX: 150, clientY: 160 });

    expect(document.querySelector('.trend-hover-group')).toBeInTheDocument();
    expect(document.querySelector('.trend-crosshair')).toBeInTheDocument();
    expect(document.querySelector('.trend-tooltip-bg')).toBeInTheDocument();
  });

  it('hides the tooltip when the mouse leaves the chart', () => {
    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} />);

    const svg = screen.getByRole('img', { name: 'Monthly income and spending bar chart' });
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 920, height: 320, right: 920, bottom: 320, x: 0, y: 0, toJSON: () => ({}) });

    fireEvent.mouseMove(svg, { clientX: 150, clientY: 160 });
    expect(document.querySelector('.trend-hover-group')).toBeInTheDocument();

    fireEvent.mouseLeave(svg);
    expect(document.querySelector('.trend-hover-group')).not.toBeInTheDocument();
  });

  it('calls month selection callback when a month label is clicked', async () => {
    const user = userEvent.setup();
    const onMonthSelect = vi.fn();

    render(<IncomeVsSpendingChart trends={sampleTrends} isLoading={false} isError={false} onMonthSelect={onMonthSelect} />);

    await user.click(screen.getByText('Nov 25'));

    expect(onMonthSelect).toHaveBeenCalledWith('2025-11');
  });
});
