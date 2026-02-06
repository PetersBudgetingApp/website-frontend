import type { CategoryDto } from '@shared/api/endpoints';

interface CategoryPickerProps {
  categories: CategoryDto[];
  value?: number;
  disabled?: boolean;
  onChange: (categoryId?: number) => void;
}

export function CategoryPicker({ categories, value, disabled, onChange }: CategoryPickerProps) {
  return (
    <select
      className="select"
      aria-label="Category"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
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
