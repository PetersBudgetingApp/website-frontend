import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@shared/api/endpoints/categories';
import { queryKeys } from '@shared/query/keys';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { CategoryTree } from '@features/categories/components/CategoryTree';

const emptyForm = {
  id: null as number | null,
  name: '',
  parentId: '',
  icon: '',
  color: '',
  categoryType: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const categoriesTreeQuery = useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => getCategories(false),
  });

  const categoriesFlatQuery = useQuery({
    queryKey: queryKeys.categories.flat(),
    queryFn: () => getCategories(true),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId ? Number(form.parentId) : null,
        icon: form.icon || undefined,
        color: form.color || undefined,
        categoryType: form.categoryType,
      };

      if (form.id) {
        return updateCategory(form.id, payload);
      }
      return createCategory(payload);
    },
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      if (form.id) {
        setForm(emptyForm);
      }
    },
  });

  const editableCategories = useMemo(
    () => (categoriesFlatQuery.data ?? []).filter((item) => !item.system),
    [categoriesFlatQuery.data],
  );

  const loadForEdit = (id: number) => {
    const target = editableCategories.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setForm({
      id: target.id,
      name: target.name,
      parentId: target.parentId ? String(target.parentId) : '',
      icon: target.icon ?? '',
      color: target.color ?? '',
      categoryType: target.categoryType,
    });
  };

  return (
    <section className="page">
      <h2>Categories</h2>

      <Card title={form.id ? 'Edit Category' : 'Create Category'}>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Input
            id="category-name"
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Select
            id="category-type"
            label="Type"
            value={form.categoryType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, categoryType: event.target.value as 'INCOME' | 'EXPENSE' | 'TRANSFER' }))
            }
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </Select>

          <Select
            id="category-parent"
            label="Parent"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">No parent</option>
            {(categoriesFlatQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            id="category-icon"
            label="Icon token"
            value={form.icon}
            onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
          />

          <Input
            id="category-color"
            label="Color"
            value={form.color}
            onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
            {form.id ? 'Update category' : 'Create category'}
          </Button>
          {form.id && (
            <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      <Card title="Category Tree">
        {categoriesTreeQuery.data && categoriesTreeQuery.data.length > 0 ? (
          <CategoryTree
            categories={categoriesTreeQuery.data}
            onEdit={loadForEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ) : (
          <EmptyState title="No categories" description="Create your first custom category to begin." />
        )}
      </Card>
    </section>
  );
}
