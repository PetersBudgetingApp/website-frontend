import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BudgetEditorTable } from '@features/budgets/components/BudgetEditorTable';

describe('BudgetEditorTable', () => {
  it('updates a target amount field', async () => {
    const user = userEvent.setup();
    const onTargetChange = vi.fn();

    render(
      <BudgetEditorTable
        categories={[{ id: 10, name: 'Food', categoryType: 'EXPENSE', system: false }]}
        targetsByCategory={{}}
        actualByCategory={new Map([[10, 250]])}
        onDeleteTarget={() => undefined}
        onTargetChange={onTargetChange}
      />,
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, '500');

    expect(onTargetChange).toHaveBeenCalled();
  });
});
