import type { CategoryDto } from '@shared/api/endpoints/categories';

const UNCATEGORIZED_NAME = 'uncategorized';

export function isUncategorizedCategory(category: Pick<CategoryDto, 'categoryType' | 'name' | 'system'>): boolean {
  return category.categoryType === 'UNCATEGORIZED' || (category.system && category.name.trim().toLowerCase() === UNCATEGORIZED_NAME);
}

export function findUncategorizedCategory(categories: CategoryDto[]): CategoryDto | undefined {
  return categories.find((category) => isUncategorizedCategory(category));
}

export function sortCategoriesWithUncategorizedFirst(categories: CategoryDto[]): CategoryDto[] {
  const uncategorized = categories.filter((category) => isUncategorizedCategory(category));
  const others = categories.filter((category) => !isUncategorizedCategory(category));
  return [...uncategorized, ...others];
}

export function sortCategoriesWithUncategorizedLast(categories: CategoryDto[]): CategoryDto[] {
  const uncategorized = categories.filter((category) => isUncategorizedCategory(category));
  const others = categories.filter((category) => !isUncategorizedCategory(category));
  return [...others, ...uncategorized];
}
