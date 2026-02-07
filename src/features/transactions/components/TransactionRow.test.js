import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransactionRow } from '@features/transactions/components/TransactionRow';
describe('TransactionRow', () => {
    it('calls note save handler', async () => {
        const user = userEvent.setup();
        const onNotesSave = vi.fn();
        render(_jsx("table", { children: _jsx("tbody", { children: _jsx(TransactionRow, { transaction: {
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
                    }, categories: [{ id: 3, name: 'Food', categoryType: 'EXPENSE', system: false }], onCategoryChange: () => undefined, onExcludeToggle: () => undefined, onNotesSave: onNotesSave }) }) }));
        await user.type(screen.getByPlaceholderText('Notes'), 'morning purchase');
        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(onNotesSave).toHaveBeenCalledWith(1, 'morning purchase');
    });
});
