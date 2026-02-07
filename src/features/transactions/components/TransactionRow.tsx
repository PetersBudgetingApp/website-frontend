import { useState } from 'react';
import type { CategoryDto } from '@shared/api/endpoints/categories';
import type { TransactionDto } from '@shared/api/endpoints/transactions';
import { formatCurrency, formatDate } from '@domain/format';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { CategoryPicker } from '@features/transactions/components/CategoryPicker';

interface TransactionRowProps {
  transaction: TransactionDto;
  categories: CategoryDto[];
  onCategoryChange: (transactionId: number, categoryId: number | null) => void;
  onExcludeToggle: (transactionId: number, excludeFromTotals: boolean) => void;
  onNotesSave: (transactionId: number, notes: string) => void;
  onAddRule: (transaction: TransactionDto) => void;
  disabled?: boolean;
}

export function TransactionRow({
  transaction,
  categories,
  onCategoryChange,
  onExcludeToggle,
  onNotesSave,
  onAddRule,
  disabled,
}: TransactionRowProps) {
  const [notes, setNotes] = useState(transaction.notes ?? '');

  return (
    <tr>
      <td>{formatDate(transaction.postedAt)}</td>
      <td>
        <div>{transaction.description ?? transaction.payee ?? 'Unknown'}</div>
        {transaction.internalTransfer && <Badge>Transfer</Badge>}
        <div style={{ marginTop: '0.35rem' }}>
          <Button type="button" variant="ghost" onClick={() => onAddRule(transaction)} disabled={disabled}>
            Add Rule
          </Button>
        </div>
      </td>
      <td>{transaction.accountName ?? 'Unknown account'}</td>
      <td className={`number ${transaction.amount < 0 ? '' : ''}`}>{formatCurrency(transaction.amount)}</td>
      <td>
        <CategoryPicker
          categories={categories}
          value={transaction.category?.id ?? null}
          disabled={disabled}
          onChange={(categoryId) => onCategoryChange(transaction.id, categoryId)}
        />
      </td>
      <td>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={transaction.excludeFromTotals}
            onChange={(event) => onExcludeToggle(transaction.id, event.target.checked)}
            disabled={disabled}
          />
          Exclude
        </label>
      </td>
      <td>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr auto' }}>
          <input
            className="input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
            disabled={disabled}
          />
          <Button type="button" variant="ghost" onClick={() => onNotesSave(transaction.id, notes)} disabled={disabled}>
            Save
          </Button>
        </div>
      </td>
    </tr>
  );
}
