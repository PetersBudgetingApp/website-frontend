import type { ReactNode } from 'react';
import type { CategoryDto } from '@shared/api/endpoints';
import { Button } from '@shared/ui/Button';

interface CategoryTreeProps {
  categories: CategoryDto[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function renderNodes(
  categories: CategoryDto[],
  handlers: Pick<CategoryTreeProps, 'onEdit' | 'onDelete'>,
  depth = 0,
): ReactNode {
  return categories.map((category) => (
    <div key={category.id} style={{ marginLeft: `${depth * 14}px`, padding: '0.3rem 0' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong>{category.name}</strong>
          <span className="subtle" style={{ marginLeft: '0.4rem' }}>
            {category.categoryType}
          </span>
          {category.system && (
            <span className="subtle" style={{ marginLeft: '0.4rem' }}>
              system
            </span>
          )}
        </div>

        {!category.system && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Button type="button" variant="ghost" onClick={() => handlers.onEdit(category.id)}>
              Edit
            </Button>
            <Button type="button" variant="danger" onClick={() => handlers.onDelete(category.id)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {category.children && category.children.length > 0 && renderNodes(category.children, handlers, depth + 1)}
    </div>
  ));
}

export function CategoryTree({ categories, onEdit, onDelete }: CategoryTreeProps) {
  return <div>{renderNodes(categories, { onEdit, onDelete })}</div>;
}
