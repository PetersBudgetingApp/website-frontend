import type { CategoryDto } from '@shared/api/endpoints/categories';
import { findUncategorizedCategory, sortCategoriesWithUncategorizedFirst } from '@shared/utils/categories';

interface CategoryPickerProps {
  categories: CategoryDto[];
  value?: number | null;
  disabled?: boolean;
  className?: string;
  onChange: (categoryId: number | null) => void;
}

export function CategoryPicker({ categories, value, disabled, className = '', onChange }: CategoryPickerProps) {
  const orderedCategories = sortCategoriesWithUncategorizedFirst(categories);
  const uncategorizedCategory = findUncategorizedCategory(orderedCategories);

  return (
    <select
      className={`select ${className}`.trim()}
      aria-label="Category"
      value={value ?? (uncategorizedCategory?.id ?? '')}
      onChange={(event) => {
        const selectedValue = event.target.value;
        if (!selectedValue) {
          onChange(uncategorizedCategory ? uncategorizedCategory.id : null);
          return;
        }
        onChange(Number(selectedValue));
      }}
      disabled={disabled}
    >
      {orderedCategories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
