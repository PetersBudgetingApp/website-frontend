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
          { id: 99, name: 'Uncategorized', categoryType: 'UNCATEGORIZED', system: true },
          { id: 1, name: 'Food', categoryType: 'EXPENSE', system: false },
          { id: 2, name: 'Utilities', categoryType: 'EXPENSE', system: false },
        ]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Category'), '2');

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('defaults to the uncategorized category when value is missing', () => {
    const onChange = vi.fn();

    render(
      <CategoryPicker
        value={null}
        categories={[
          { id: 99, name: 'Uncategorized', categoryType: 'UNCATEGORIZED', system: true },
          { id: 1, name: 'Food', categoryType: 'EXPENSE', system: false },
          { id: 2, name: 'Utilities', categoryType: 'EXPENSE', system: false },
        ]}
        onChange={onChange}
      />,
    );

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select.value).toBe('99');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders uncategorized as the first option', () => {
    const onChange = vi.fn();

    render(
      <CategoryPicker
        value={99}
        categories={[
          { id: 1, name: 'Food', categoryType: 'EXPENSE', system: false },
          { id: 99, name: 'Uncategorized', categoryType: 'UNCATEGORIZED', system: true },
          { id: 2, name: 'Utilities', categoryType: 'EXPENSE', system: false },
        ]}
        onChange={onChange}
      />,
    );

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveValue('99');
    expect(options[0]).toHaveTextContent('Uncategorized');
  });
});
