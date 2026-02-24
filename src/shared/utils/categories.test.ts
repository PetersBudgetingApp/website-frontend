import { describe, expect, it } from 'vitest';
import {
  findUncategorizedCategory,
  isUncategorizedCategory,
  sortCategoriesWithUncategorizedFirst,
  sortCategoriesWithUncategorizedLast,
} from '@shared/utils/categories';

const categories = [
  { id: 1, name: 'Food', categoryType: 'EXPENSE' as const, system: false },
  { id: 2, name: 'Travel', categoryType: 'EXPENSE' as const, system: false },
  { id: 3, name: 'Uncategorized', categoryType: 'UNCATEGORIZED' as const, system: true },
];

describe('categories utils', () => {
  it('detects uncategorized categories', () => {
    expect(isUncategorizedCategory(categories[2])).toBe(true);
    expect(isUncategorizedCategory(categories[0])).toBe(false);
  });

  it('finds the uncategorized category', () => {
    expect(findUncategorizedCategory(categories)?.id).toBe(3);
  });

  it('sorts uncategorized first', () => {
    const ordered = sortCategoriesWithUncategorizedFirst(categories);
    expect(ordered[0]?.id).toBe(3);
    expect(ordered[1]?.id).toBe(1);
    expect(ordered[2]?.id).toBe(2);
  });

  it('sorts uncategorized last', () => {
    const ordered = sortCategoriesWithUncategorizedLast(categories);
    expect(ordered[0]?.id).toBe(1);
    expect(ordered[1]?.id).toBe(2);
    expect(ordered[2]?.id).toBe(3);
  });
});
