import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@domain/format';
import { getAccounts } from '@shared/api/endpoints/accounts';
import {
  createCategorizationRule,
  createCategory,
  deleteCategorizationRule,
  deleteCategory,
  getCategorizationRules,
  getCategorizationRuleTransactions,
  getCategories,
  updateCategorizationRule,
  updateCategory,
  type CategoryDto,
  type CategorizationRuleConditionDto,
  type RuleConditionOperator,
  type RuleMatchField,
  type RulePatternType,
} from '@shared/api/endpoints/categories';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { CategoryTree } from '@features/categories/components/CategoryTree';

const emptyCategoryForm = {
  id: null as number | null,
  name: '',
  parentId: '',
  icon: '',
  color: '',
  categoryType: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
};

const emptyRuleForm = {
  id: null as number | null,
  name: '',
  conditionOperator: 'AND' as RuleConditionOperator,
  conditions: [{ field: 'DESCRIPTION' as RuleMatchField, patternType: 'CONTAINS' as RulePatternType, value: '' }],
  categoryId: '',
  priority: '0',
  active: true,
};

const textPatternTypeOptions: { value: RulePatternType; label: string }[] = [
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'STARTS_WITH', label: 'Starts with' },
  { value: 'ENDS_WITH', label: 'Ends with' },
  { value: 'EXACT', label: 'Exact' },
  { value: 'REGEX', label: 'Regex' },
];

const amountPatternTypeOptions: { value: RulePatternType; label: string }[] = [
  { value: 'EXACT', label: 'Exact' },
  { value: 'EQUALS', label: 'Equals' },
  { value: 'GREATER_THAN', label: 'Greater than' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater than or equal' },
  { value: 'LESS_THAN', label: 'Less than' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less than or equal' },
];

const fieldLabelByValue: Record<RuleMatchField, string> = {
  DESCRIPTION: 'Description',
  PAYEE: 'Payee',
  MEMO: 'Memo',
  ACCOUNT: 'Account',
  AMOUNT: 'Amount',
};

const patternTypeLabelByValue: Record<RulePatternType, string> = {
  CONTAINS: 'contains',
  STARTS_WITH: 'starts with',
  ENDS_WITH: 'ends with',
  EXACT: 'is exactly',
  REGEX: 'matches regex',
  EQUALS: 'equals',
  GREATER_THAN: 'is greater than',
  GREATER_THAN_OR_EQUAL: 'is greater than or equal to',
  LESS_THAN: 'is less than',
  LESS_THAN_OR_EQUAL: 'is less than or equal to',
};

function defaultPatternTypeForField(field: RuleMatchField): RulePatternType {
  if (field === 'ACCOUNT') {
    return 'EQUALS';
  }
  if (field === 'AMOUNT') {
    return 'EQUALS';
  }
  return 'CONTAINS';
}

function allowedPatternTypes(field: RuleMatchField): RulePatternType[] {
  if (field === 'ACCOUNT') {
    return ['EQUALS', 'EXACT'];
  }
  if (field === 'AMOUNT') {
    return amountPatternTypeOptions.map((option) => option.value);
  }
  return textPatternTypeOptions.map((option) => option.value);
}

function effectiveRuleConditions(rule: {
  conditions?: CategorizationRuleConditionDto[];
  matchField: RuleMatchField;
  patternType: RulePatternType;
  pattern: string;
}): CategorizationRuleConditionDto[] {
  if ((rule.conditions ?? []).length > 0) {
    return rule.conditions ?? [];
  }
  if (!rule.pattern) {
    return [];
  }
  return [{ field: rule.matchField, patternType: rule.patternType, value: rule.pattern }];
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);

  const categoriesTreeQuery = useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => getCategories(false),
  });

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.all(),
    queryFn: getAccounts,
  });

  const categoriesFlatQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
  });

  const rulesQuery = useQuery({
    queryKey: queryKeys.categories.rules(),
    queryFn: getCategorizationRules,
  });

  const ruleTransactionsQuery = useQuery({
    queryKey: queryKeys.categories.ruleTransactions(expandedRuleId ?? 0),
    queryFn: () => getCategorizationRuleTransactions(expandedRuleId ?? 0),
    enabled: expandedRuleId !== null,
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.name.trim(),
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        icon: categoryForm.icon || undefined,
        color: categoryForm.color || undefined,
        categoryType: categoryForm.categoryType,
      };

      if (categoryForm.id) {
        return updateCategory(categoryForm.id, payload);
      }
      return createCategory(payload);
    },
    onSuccess: () => {
      setCategoryForm(emptyCategoryForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      if (categoryForm.id) {
        setCategoryForm(emptyCategoryForm);
      }
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: async () => {
      const normalizedConditions = ruleForm.conditions.map((condition) => ({
        field: condition.field,
        patternType: condition.patternType,
        value: condition.value.trim(),
      }));
      const primaryCondition = normalizedConditions[0];
      const payload = {
        name: ruleForm.name.trim(),
        pattern: primaryCondition.value,
        patternType: primaryCondition.patternType,
        matchField: primaryCondition.field,
        conditionOperator: ruleForm.conditionOperator,
        conditions: normalizedConditions,
        categoryId: Number(ruleForm.categoryId),
        priority: Number(ruleForm.priority) || 0,
        active: ruleForm.active,
      };

      if (ruleForm.id) {
        return updateCategorizationRule(ruleForm.id, payload);
      }
      return createCategorizationRule(payload);
    },
    onSuccess: () => {
      setRuleForm(emptyRuleForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.rules() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteCategorizationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.rules() });
      if (ruleForm.id) {
        setRuleForm(emptyRuleForm);
      }
    },
  });

  const allCategories = categoriesFlatQuery.data ?? [];

  const categoryNameById = useMemo(
    () =>
      new Map<number, string>((categoriesFlatQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesFlatQuery.data],
  );
  const accountNameById = useMemo(
    () => new Map<number, string>((accountsQuery.data ?? []).map((account) => [account.id, account.name])),
    [accountsQuery.data],
  );

  const loadCategoryForEdit = (id: number) => {
    const target = allCategories.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setCategoryForm({
      id: target.id,
      name: target.name,
      parentId: target.parentId ? String(target.parentId) : '',
      icon: target.icon ?? '',
      color: target.color ?? '',
      categoryType: target.categoryType,
    });
  };

  const inspectCategory = (id: number) => {
    setSelectedCategoryId(id);
    setExpandedRuleId(null);
  };

  const loadRuleForEdit = (id: number) => {
    const target = (rulesQuery.data ?? []).find((item) => item.id === id);
    if (!target) {
      return;
    }

    const conditions = effectiveRuleConditions(target);

    setRuleForm({
      id: target.id,
      name: target.name,
      conditionOperator: target.conditionOperator ?? 'AND',
      conditions: conditions.map((condition) => ({
        field: condition.field,
        patternType: condition.patternType,
        value: condition.value,
      })),
      categoryId: String(target.categoryId),
      priority: String(target.priority),
      active: target.active,
    });
  };

  const setRuleConditionField = (index: number, field: RuleMatchField) => {
    setRuleForm((prev) => {
      const nextConditions = prev.conditions.map((condition, conditionIndex) => {
        if (conditionIndex !== index) {
          return condition;
        }

        return {
          ...condition,
          field,
          patternType: defaultPatternTypeForField(field),
          value: '',
        };
      });

      return { ...prev, conditions: nextConditions };
    });
  };

  const setRuleConditionPatternType = (index: number, patternType: RulePatternType) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, patternType } : condition,
      ),
    }));
  };

  const setRuleConditionValue = (index: number, value: string) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, value } : condition,
      ),
    }));
  };

  const addRuleCondition = () => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'DESCRIPTION', patternType: 'CONTAINS', value: '' }],
    }));
  };

  const removeRuleCondition = (index: number) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, conditionIndex) => conditionIndex !== index),
    }));
  };

  const formatRuleCondition = (condition: CategorizationRuleConditionDto) => {
    if (condition.field === 'ACCOUNT') {
      const accountId = Number(condition.value);
      const accountName = Number.isNaN(accountId) ? null : accountNameById.get(accountId);
      return `${fieldLabelByValue[condition.field]} ${patternTypeLabelByValue[condition.patternType]} "${accountName ?? condition.value}"`;
    }

    return `${fieldLabelByValue[condition.field]} ${patternTypeLabelByValue[condition.patternType]} "${condition.value}"`;
  };

  const isRuleFormValid =
    ruleForm.name.trim().length > 0 &&
    ruleForm.categoryId.length > 0 &&
    ruleForm.conditions.length > 0 &&
    ruleForm.conditions.every((condition) => condition.value.trim().length > 0);

  const renderCategoryRuleDetails = (category: CategoryDto) => {
    const categoryRules = (rulesQuery.data ?? []).filter((rule) => rule.categoryId === category.id);

    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <strong>{category.name} Rules</strong>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelectedCategoryId(null);
              setExpandedRuleId(null);
            }}
          >
            Close
          </Button>
        </div>

        {categoryRules.length > 0 ? (
          <>
            <div className="subtle">
              {categoryRules.length} associated rule{categoryRules.length === 1 ? '' : 's'}.
            </div>

            {categoryRules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--surface)',
                  padding: '0.65rem 0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <strong>{rule.name}</strong>
                    <div className="subtle" style={{ marginTop: '0.2rem' }}>
                      {effectiveRuleConditions(rule)
                        .map((condition) => formatRuleCondition(condition))
                        .join(` ${rule.conditionOperator ?? 'AND'} `)}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setExpandedRuleId((prev) => (prev === rule.id ? null : rule.id))}
                  >
                    {expandedRuleId === rule.id ? 'Hide transactions' : 'See transactions'}
                  </Button>
                </div>

                {expandedRuleId === rule.id && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    {ruleTransactionsQuery.isPending ? (
                      <p className="subtle">Loading transactions...</p>
                    ) : ruleTransactionsQuery.isError ? (
                      <p className="subtle">Could not load transactions for this rule.</p>
                    ) : (ruleTransactionsQuery.data ?? []).length > 0 ? (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Account</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ruleTransactionsQuery.data ?? []).map((transaction) => (
                            <tr key={transaction.id}>
                              <td>{formatDate(transaction.postedAt)}</td>
                              <td>{transaction.description ?? transaction.payee ?? transaction.memo ?? 'Unknown'}</td>
                              <td>{transaction.accountName ?? 'Unknown account'}</td>
                              <td className="number">{formatCurrency(transaction.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="subtle">No tracked transactions for this rule yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <EmptyState
            title="No rules for this category"
            description="Create or edit a rule and assign it to this category to see it here."
          />
        )}
      </div>
    );
  };

  return (
    <section className="page">
      <h2>Categories</h2>

      <Card title={categoryForm.id ? 'Edit Category' : 'Create Category'}>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Input
            id="category-name"
            label="Name"
            value={categoryForm.name}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Select
            id="category-type"
            label="Type"
            value={categoryForm.categoryType}
            onChange={(event) =>
              setCategoryForm((prev) => ({
                ...prev,
                categoryType: event.target.value as 'INCOME' | 'EXPENSE' | 'TRANSFER',
              }))
            }
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </Select>

          <Select
            id="category-parent"
            label="Parent"
            value={categoryForm.parentId}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">No parent</option>
            {allCategories
              .filter((category) => category.id !== categoryForm.id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </Select>

          <Input
            id="category-icon"
            label="Icon token"
            value={categoryForm.icon}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
          />

          <Input
            id="category-color"
            label="Color"
            value={categoryForm.color}
            onChange={(event) => setCategoryForm((prev) => ({ ...prev, color: event.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button
            type="button"
            onClick={() => saveCategoryMutation.mutate()}
            disabled={saveCategoryMutation.isPending || !categoryForm.name.trim()}
          >
            {categoryForm.id ? 'Update category' : 'Create category'}
          </Button>
          {categoryForm.id && (
            <Button type="button" variant="secondary" onClick={() => setCategoryForm(emptyCategoryForm)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card title="Category Tree">
        {categoriesTreeQuery.data && categoriesTreeQuery.data.length > 0 ? (
          <CategoryTree
            categories={categoriesTreeQuery.data}
            onEdit={loadCategoryForEdit}
            onDelete={(id) => deleteCategoryMutation.mutate(id)}
            onSelect={inspectCategory}
            selectedId={selectedCategoryId}
            renderDetails={renderCategoryRuleDetails}
          />
        ) : (
          <EmptyState title="No categories" description="Create your first category to begin." />
        )}
      </Card>

      <Card title={ruleForm.id ? 'Edit Auto-Categorization Rule' : 'Auto-Categorization Rules'}>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Input
            id="rule-name"
            label="Rule name"
            value={ruleForm.name}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Select
            id="rule-category"
            label="Assign category"
            value={ruleForm.categoryId}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">Select category</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            id="rule-condition-operator"
            label="Filter join"
            value={ruleForm.conditionOperator}
            onChange={(event) =>
              setRuleForm((prev) => ({ ...prev, conditionOperator: event.target.value as RuleConditionOperator }))
            }
          >
            <option value="AND">All filters must match (AND)</option>
            <option value="OR">Any filter can match (OR)</option>
          </Select>

          <Input
            id="rule-priority"
            label="Priority"
            type="number"
            value={ruleForm.priority}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, priority: event.target.value }))}
          />

          <Select
            id="rule-active"
            label="Status"
            value={ruleForm.active ? 'active' : 'inactive'}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, active: event.target.value === 'active' }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {ruleForm.conditions.map((condition, index) => {
            const availablePatternTypes = allowedPatternTypes(condition.field);

            return (
              <div
                key={`rule-condition-${index}`}
                style={{
                  display: 'grid',
                  gap: '0.5rem',
                  gridTemplateColumns: '1.25fr 1.25fr 2fr auto',
                  alignItems: 'end',
                }}
              >
                <Select
                  id={`rule-condition-field-${index}`}
                  label={index === 0 ? 'Field' : ''}
                  value={condition.field}
                  onChange={(event) => setRuleConditionField(index, event.target.value as RuleMatchField)}
                >
                  <option value="DESCRIPTION">Description</option>
                  <option value="PAYEE">Payee</option>
                  <option value="MEMO">Memo</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="AMOUNT">Amount</option>
                </Select>

                <Select
                  id={`rule-condition-pattern-type-${index}`}
                  label={index === 0 ? 'Operator' : ''}
                  value={condition.patternType}
                  onChange={(event) => setRuleConditionPatternType(index, event.target.value as RulePatternType)}
                >
                  {availablePatternTypes.map((patternType) => (
                    <option key={patternType} value={patternType}>
                      {patternTypeLabelByValue[patternType]}
                    </option>
                  ))}
                </Select>

                {condition.field === 'ACCOUNT' ? (
                  <Select
                    id={`rule-condition-value-${index}`}
                    label={index === 0 ? 'Value' : ''}
                    value={condition.value}
                    onChange={(event) => setRuleConditionValue(index, event.target.value)}
                  >
                    <option value="">Select account</option>
                    {(accountsQuery.data ?? []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`rule-condition-value-${index}`}
                    label={index === 0 ? 'Value' : ''}
                    type={condition.field === 'AMOUNT' ? 'number' : 'text'}
                    step={condition.field === 'AMOUNT' ? '0.01' : undefined}
                    value={condition.value}
                    placeholder={condition.field === 'AMOUNT' ? '-250.00' : 'Match value'}
                    onChange={(event) => setRuleConditionValue(index, event.target.value)}
                  />
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeRuleCondition(index)}
                  disabled={ruleForm.conditions.length <= 1}
                >
                  Remove
                </Button>
              </div>
            );
          })}

          <div>
            <Button type="button" variant="ghost" onClick={addRuleCondition}>
              Add filter
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button
            type="button"
            onClick={() => saveRuleMutation.mutate()}
            disabled={saveRuleMutation.isPending || !isRuleFormValid}
          >
            {ruleForm.id ? 'Update rule' : 'Create rule'}
          </Button>
          {ruleForm.id && (
            <Button type="button" variant="secondary" onClick={() => setRuleForm(emptyRuleForm)}>
              Cancel
            </Button>
          )}
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {(rulesQuery.data ?? []).length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {(rulesQuery.data ?? []).map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.75rem',
                  }}
                >
                  <div>
                    <strong>{rule.name}</strong>
                    <div className="subtle" style={{ marginTop: '0.2rem' }}>
                      {effectiveRuleConditions(rule)
                        .map((condition) => formatRuleCondition(condition))
                        .join(` ${rule.conditionOperator ?? 'AND'} `)} →{' '}
                      {categoryNameById.get(rule.categoryId) ?? `Category #${rule.categoryId}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button type="button" variant="ghost" onClick={() => loadRuleForEdit(rule.id)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No auto-categorization rules"
              description="Add one or more filters and assign a category for incoming transactions."
            />
          )}
        </div>
      </Card>
    </section>
  );
}
