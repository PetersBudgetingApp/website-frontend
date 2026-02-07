import type { BudgetTarget } from '@domain/types';
import { formatCurrency } from '@domain/format';
import type { CategoryDto } from '@shared/api/endpoints/categories';
import { Button } from '@shared/ui/Button';

interface BudgetEditorTableProps {
  categories: CategoryDto[];
  targetsByCategory: Record<number, BudgetTarget>;
  actualByCategory: Map<number, number>;
  onTargetChange: (categoryId: number, field: 'targetAmount' | 'notes', value: string) => void;
  onDeleteTarget: (categoryId: number) => void;
}

export function BudgetEditorTable({
  categories,
  targetsByCategory,
  actualByCategory,
  onTargetChange,
  onDeleteTarget,
}: BudgetEditorTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Target</th>
          <th>Actual</th>
          <th>Variance</th>
          <th>Notes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => {
          const target = targetsByCategory[category.id];
          const targetAmount = target?.targetAmount ?? 0;
          const notes = target?.notes ?? '';
          const actual = actualByCategory.get(category.id) ?? 0;
          const variance = targetAmount - actual;

          return (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>
                <input
                  className="input number"
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount === 0 ? '' : targetAmount}
                  onChange={(event) => onTargetChange(category.id, 'targetAmount', event.target.value)}
                />
              </td>
              <td className="number">{formatCurrency(actual)}</td>
              <td className={`number ${variance < 0 ? 'field-error' : ''}`}>{formatCurrency(variance)}</td>
              <td>
                <input
                  className="input"
                  value={notes}
                  onChange={(event) => onTargetChange(category.id, 'notes', event.target.value)}
                  placeholder="Optional"
                />
              </td>
              <td>
                <Button type="button" variant="ghost" onClick={() => onDeleteTarget(category.id)}>
                  Clear
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
