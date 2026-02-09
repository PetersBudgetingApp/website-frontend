import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransactionRow } from '@features/transactions/components/TransactionRow';

describe('TransactionRow', () => {
  it('autosaves notes from the row actions menu', async () => {
    const user = userEvent.setup();
    const onNotesChange = vi.fn();

    render(
      <TransactionRow
        transaction={{
          id: 1,
          accountId: 2,
          accountName: 'Checking',
          postedAt: '2026-02-01T00:00:00Z',
          amount: -10,
          pending: false,
          description: 'Coffee',
          manuallyCategorized: false,
          internalTransfer: false,
          excludeFromTotals: false,
          recurring: false,
          manualEntry: true,
        }}
        categories={[{ id: 3, name: 'Food', categoryType: 'EXPENSE', system: false }]}
        onCategoryChange={() => undefined}
        onExcludeToggle={() => undefined}
        onNotesChange={onNotesChange}
        onAddRule={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Transaction actions for 1' }));
    await user.click(screen.getByRole('button', { name: 'Notes' }));
    await user.type(screen.getByLabelText('Notes for transaction 1'), 'morning purchase');

    await waitFor(() => {
      expect(onNotesChange).toHaveBeenLastCalledWith(1, 'morning purchase');
    });
  });

  it('shows delete for manual entries and triggers callback on confirm', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TransactionRow
        transaction={{
          id: 11,
          accountId: 2,
          accountName: 'Checking',
          postedAt: '2026-02-01T00:00:00Z',
          amount: -10,
          pending: false,
          description: 'Coffee',
          manuallyCategorized: false,
          internalTransfer: false,
          excludeFromTotals: false,
          recurring: false,
          manualEntry: true,
        }}
        categories={[{ id: 3, name: 'Food', categoryType: 'EXPENSE', system: false }]}
        onCategoryChange={() => undefined}
        onExcludeToggle={() => undefined}
        onNotesChange={() => undefined}
        onAddRule={() => undefined}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Transaction actions for 11' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this manually created transaction?');
    expect(onDelete).toHaveBeenCalledWith(11);

    confirmSpy.mockRestore();
  });
});
