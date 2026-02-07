import type { ReactNode } from 'react';
import type { CategoryDto } from '@shared/api/endpoints/categories';
import { Button } from '@shared/ui/Button';

interface CategoryTreeProps {
  categories: CategoryDto[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSelect?: (id: number) => void;
  selectedId?: number | null;
  renderDetails?: (category: CategoryDto) => ReactNode;
}

function renderNodes(
  categories: CategoryDto[],
  handlers: Pick<CategoryTreeProps, 'onEdit' | 'onDelete' | 'onSelect' | 'selectedId' | 'renderDetails'>,
  depth = 0,
): ReactNode {
  return categories.map((category) => (
    <div key={category.id} style={{ marginLeft: `${depth * 14}px`, padding: '0.3rem 0' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button
            type="button"
            onClick={() => handlers.onSelect?.(category.id)}
            style={{
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: handlers.onSelect ? 'pointer' : 'default',
              color: handlers.selectedId === category.id ? 'var(--brand)' : 'inherit',
              fontWeight: 700,
            }}
          >
            {category.name}
          </button>
          <span className="subtle" style={{ marginLeft: '0.4rem' }}>
            {category.categoryType}
          </span>
          {category.system && (
            <span className="subtle" style={{ marginLeft: '0.4rem' }}>
              system
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <Button type="button" variant="ghost" onClick={() => handlers.onEdit(category.id)}>
            Edit
          </Button>
          <Button type="button" variant="danger" onClick={() => handlers.onDelete(category.id)}>
            {category.system ? 'Remove' : 'Delete'}
          </Button>
        </div>
      </div>

      {handlers.selectedId === category.id && handlers.renderDetails && (
        <div
          style={{
            marginTop: '0.55rem',
            border: '1px solid var(--border)',
            borderRadius: '0.6rem',
            background: 'var(--surface-alt)',
            boxShadow: 'var(--shadow)',
            padding: '0.75rem',
          }}
        >
          {handlers.renderDetails(category)}
        </div>
      )}

      {category.children && category.children.length > 0 && renderNodes(category.children, handlers, depth + 1)}
    </div>
  ));
}

export function CategoryTree({ categories, onEdit, onDelete, onSelect, selectedId = null, renderDetails }: CategoryTreeProps) {
  return <div>{renderNodes(categories, { onEdit, onDelete, onSelect, selectedId, renderDetails })}</div>;
}
