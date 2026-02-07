import { z } from 'zod';
import { categorizationRuleSchema, categorySchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const categoriesSchema = z.array(categorySchema);
const categorizationRulesSchema = z.array(categorizationRuleSchema);

export type CategoryDto = z.infer<typeof categorySchema>;
export type CategorizationRuleDto = z.infer<typeof categorizationRuleSchema>;

export interface CategoryUpsertRequest {
  parentId: number | null;
  name: string;
  icon?: string;
  color?: string;
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export interface CategorizationRuleUpsertRequest {
  name: string;
  pattern: string;
  patternType: 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXACT' | 'REGEX';
  matchField: 'DESCRIPTION' | 'PAYEE' | 'MEMO';
  categoryId: number;
  priority: number;
  active: boolean;
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

export async function getCategorizationRules() {
  return apiClient.request('categorization-rules', {
    schema: categorizationRulesSchema,
  });
}

export async function createCategorizationRule(input: CategorizationRuleUpsertRequest) {
  return apiClient.request('categorization-rules', {
    method: 'POST',
    body: input,
    schema: categorizationRuleSchema,
  });
}

export async function updateCategorizationRule(id: number, input: CategorizationRuleUpsertRequest) {
  return apiClient.request(`categorization-rules/${id}`, {
    method: 'PUT',
    body: input,
    schema: categorizationRuleSchema,
  });
}

export async function deleteCategorizationRule(id: number) {
  return apiClient.request<void>(`categorization-rules/${id}`, {
    method: 'DELETE',
  });
}
