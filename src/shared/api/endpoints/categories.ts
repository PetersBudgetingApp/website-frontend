import { z } from 'zod';
import { categorySchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const categoriesSchema = z.array(categorySchema);

export type CategoryDto = z.infer<typeof categorySchema>;

export interface CategoryUpsertRequest {
  parentId: number | null;
  name: string;
  icon?: string;
  color?: string;
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export async function getCategories(flat = false) {
  return apiClient.request('categories', {
    query: { flat },
    schema: categoriesSchema,
  });
}

export async function createCategory(input: CategoryUpsertRequest) {
  return apiClient.request('categories', {
    method: 'POST',
    body: input,
    schema: categorySchema,
  });
}

export async function updateCategory(id: number, input: CategoryUpsertRequest) {
  return apiClient.request(`categories/${id}`, {
    method: 'PUT',
    body: input,
    schema: categorySchema,
  });
}

export async function deleteCategory(id: number) {
  return apiClient.request<void>(`categories/${id}`, {
    method: 'DELETE',
  });
}
