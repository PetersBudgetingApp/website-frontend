import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryPicker } from '@features/transactions/components/CategoryPicker';

describe('CategoryPicker', () => {
  it('emits category changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CategoryPicker
        value={1}
        categories={[
          { id: 1, name: 'Food', categoryType: 'EXPENSE', system: false },
          { id: 2, name: 'Utilities', categoryType: 'EXPENSE', system: false },
        ]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Category'), '2');

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
