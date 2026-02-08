import type { CategoryDto } from '@shared/api/endpoints/categories';

interface CategoryPickerProps {
  categories: CategoryDto[];
  value?: number | null;
  disabled?: boolean;
  className?: string;
  onChange: (categoryId: number | null) => void;
}

export function CategoryPicker({ categories, value, disabled, className = '', onChange }: CategoryPickerProps) {
  return (
    <select
      className={`select ${className}`.trim()}
      aria-label="Category"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      disabled={disabled}
    >
      <option value="">Uncategorized</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
