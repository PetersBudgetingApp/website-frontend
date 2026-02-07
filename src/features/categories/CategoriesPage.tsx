import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@domain/format';
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
  pattern: '',
  patternType: 'CONTAINS' as 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXACT' | 'REGEX',
  matchField: 'DESCRIPTION' as 'DESCRIPTION' | 'PAYEE' | 'MEMO',
  categoryId: '',
  priority: '0',
  active: true,
};

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
      const payload = {
        name: ruleForm.name.trim(),
        pattern: ruleForm.pattern.trim(),
        patternType: ruleForm.patternType,
        matchField: ruleForm.matchField,
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

    setRuleForm({
      id: target.id,
      name: target.name,
      pattern: target.pattern,
      patternType: target.patternType,
      matchField: target.matchField,
      categoryId: String(target.categoryId),
      priority: String(target.priority),
      active: target.active,
    });
  };

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
                      {rule.matchField} {rule.patternType} &quot;{rule.pattern}&quot;
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

          <Input
            id="rule-pattern"
            label="Match text"
            value={ruleForm.pattern}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, pattern: event.target.value }))}
            placeholder="Tim Hortons"
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
            id="rule-match-field"
            label="Match field"
            value={ruleForm.matchField}
            onChange={(event) =>
              setRuleForm((prev) => ({ ...prev, matchField: event.target.value as 'DESCRIPTION' | 'PAYEE' | 'MEMO' }))
            }
          >
            <option value="DESCRIPTION">Description</option>
            <option value="PAYEE">Payee</option>
            <option value="MEMO">Memo</option>
          </Select>

          <Select
            id="rule-pattern-type"
            label="Pattern type"
            value={ruleForm.patternType}
            onChange={(event) =>
              setRuleForm((prev) => ({
                ...prev,
                patternType: event.target.value as 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXACT' | 'REGEX',
              }))
            }
          >
            <option value="CONTAINS">Contains</option>
            <option value="STARTS_WITH">Starts with</option>
            <option value="ENDS_WITH">Ends with</option>
            <option value="EXACT">Exact</option>
            <option value="REGEX">Regex</option>
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

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button
            type="button"
            onClick={() => saveRuleMutation.mutate()}
            disabled={
              saveRuleMutation.isPending ||
              !ruleForm.name.trim() ||
              !ruleForm.pattern.trim() ||
              !ruleForm.categoryId
            }
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
                      {rule.matchField} {rule.patternType} &quot;{rule.pattern}&quot; →{' '}
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
              description="Add a match rule like 'Tim Hortons' and assign a category for incoming transactions."
            />
          )}
        </div>
      </Card>
    </section>
  );
}
