import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BudgetInsightsPanel } from '@features/dashboard/components/BudgetInsightsPanel';

describe('BudgetInsightsPanel', () => {
  it('renders month-to-date narrative and applies recommendation', async () => {
    const user = userEvent.setup();
    const onApplyRecommendation = vi.fn();
    const onOpenDetails = vi.fn();

    render(
      <BudgetInsightsPanel
        insights={{
          month: '2026-02',
          asOfDate: '2026-02-10',
          historyMonths: 6,
          totalCurrentBudget: 1200,
          totalRecommendedBudget: 1260,
          categories: [
            {
              categoryId: 10,
              categoryName: 'Food',
              categoryColor: '#22C55E',
              currentBudget: 300,
              currentMonthSpend: 140,
              averageMonthlySpend: 350,
              recommendedBudget: 350,
              budgetDelta: 50,
              budgetDeltaPct: 16.67,
              monthToDateSpend: 140,
              averageMonthToDateSpend: 112,
              monthToDateDelta: 28,
              monthToDateDeltaPct: 25,
            },
          ],
        }}
        isLoading={false}
        isError={false}
        applyingCategoryId={null}
        statusMessage={null}
        onApplyRecommendation={onApplyRecommendation}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(
      screen.getByText("You've spent 25.0% more than usual by this time on Food."),
    ).toBeInTheDocument();
    expect(screen.getByText('Current Spend')).toBeInTheDocument();
    expect(screen.getByText('$140.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open details for Food' }));

    expect(onOpenDetails).toHaveBeenCalledWith(10);

    await user.click(screen.getByRole('button', { name: 'Apply Recommendation' }));

    expect(onApplyRecommendation).toHaveBeenCalledWith(10, 350, 'Food');
  });

  it('disables apply button when recommendation is on target', () => {
    render(
      <BudgetInsightsPanel
        insights={{
          month: '2026-02',
          asOfDate: '2026-02-10',
          historyMonths: 6,
          totalCurrentBudget: 800,
          totalRecommendedBudget: 800,
          categories: [
            {
              categoryId: 30,
              categoryName: 'Utilities',
              categoryColor: '#3182CE',
              currentBudget: 200,
              currentMonthSpend: 60,
              averageMonthlySpend: 200,
              recommendedBudget: 200,
              budgetDelta: 0,
              budgetDeltaPct: 0,
              monthToDateSpend: 60,
              averageMonthToDateSpend: 60,
              monthToDateDelta: 0,
              monthToDateDeltaPct: 0,
            },
          ],
        }}
        isLoading={false}
        isError={false}
        applyingCategoryId={null}
        statusMessage={null}
        onApplyRecommendation={() => undefined}
        onOpenDetails={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Apply Recommendation' })).toBeDisabled();
  });
});
