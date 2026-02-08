import { z } from 'zod';
import {
  categorizationRuleConditionSchema,
  categorizationRuleSchema,
  categorySchema,
  ruleConditionOperatorSchema,
  ruleMatchFieldSchema,
  rulePatternTypeSchema,
  transactionSchema,
} from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const categoriesSchema = z.array(categorySchema);
const categorizationRulesSchema = z.array(categorizationRuleSchema);
const categorizationRuleTransactionsSchema = z.array(transactionSchema);

export type CategoryDto = z.infer<typeof categorySchema>;
export type CategorizationRuleDto = z.infer<typeof categorizationRuleSchema>;
export type CategorizationRuleConditionDto = z.infer<typeof categorizationRuleConditionSchema>;
export type RulePatternType = z.infer<typeof rulePatternTypeSchema>;
export type RuleMatchField = z.infer<typeof ruleMatchFieldSchema>;
export type RuleConditionOperator = z.infer<typeof ruleConditionOperatorSchema>;

export interface CategoryUpsertRequest {
  parentId: number | null;
  name: string;
  icon?: string;
  color?: string;
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export interface CategorizationRuleUpsertRequest {
  name: string;
  pattern?: string;
  patternType?: RulePatternType;
  matchField?: RuleMatchField;
  conditionOperator?: RuleConditionOperator;
  conditions?: CategorizationRuleConditionDto[];
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

export async function getCategorizationRuleTransactions(ruleId: number, limit = 100, offset = 0) {
  return apiClient.request(`categorization-rules/${ruleId}/transactions`, {
    query: { limit, offset },
    schema: categorizationRuleTransactionsSchema,
  });
}
