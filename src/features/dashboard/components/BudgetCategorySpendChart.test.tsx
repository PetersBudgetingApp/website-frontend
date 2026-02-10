import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BudgetCategorySpendChart } from '@features/dashboard/components/BudgetCategorySpendChart';

const points = [
  { month: '2025-12', label: 'Dec 25', amount: 180 },
  { month: '2026-01', label: 'Jan 26', amount: 220 },
  { month: '2026-02', label: 'Feb 26', amount: 160 },
];

describe('BudgetCategorySpendChart', () => {
  it('renders average line and hover tooltip values', () => {
    render(
      <BudgetCategorySpendChart
        points={points}
        averageSpend={190}
        isLoading={false}
        isError={false}
      />,
    );

    expect(document.querySelector('.budget-category-average-line')).toBeInTheDocument();

    const svg = screen.getByRole('img', { name: 'Monthly category spending line chart' });
    svg.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 920,
      height: 320,
      right: 920,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(svg, { clientX: 160, clientY: 140 });

    expect(screen.getByText(/Spend:/)).toBeInTheDocument();
    expect(screen.getByText(/Average:/)).toBeInTheDocument();
  });
});
