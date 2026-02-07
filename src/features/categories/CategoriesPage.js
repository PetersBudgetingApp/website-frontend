import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@shared/api/endpoints';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { CategoryTree } from '@features/categories/components/CategoryTree';
const emptyForm = {
    id: null,
    name: '',
    parentId: '',
    icon: '',
    color: '',
    categoryType: 'EXPENSE',
};
export function CategoriesPage() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(emptyForm);
    const categoriesTreeQuery = useQuery({
        queryKey: ['categories', 'tree'],
        queryFn: () => getCategories(false),
    });
    const categoriesFlatQuery = useQuery({
        queryKey: ['categories', 'flat'],
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
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (form.id) {
                setForm(emptyForm);
            }
        },
    });
    const editableCategories = useMemo(() => (categoriesFlatQuery.data ?? []).filter((item) => !item.system), [categoriesFlatQuery.data]);
    const loadForEdit = (id) => {
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
    return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Categories" }), _jsxs(Card, { title: form.id ? 'Edit Category' : 'Create Category', children: [_jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }, children: [_jsx(Input, { id: "category-name", label: "Name", value: form.name, onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })) }), _jsxs(Select, { id: "category-type", label: "Type", value: form.categoryType, onChange: (event) => setForm((prev) => ({ ...prev, categoryType: event.target.value })), children: [_jsx("option", { value: "EXPENSE", children: "Expense" }), _jsx("option", { value: "INCOME", children: "Income" }), _jsx("option", { value: "TRANSFER", children: "Transfer" })] }), _jsxs(Select, { id: "category-parent", label: "Parent", value: form.parentId, onChange: (event) => setForm((prev) => ({ ...prev, parentId: event.target.value })), children: [_jsx("option", { value: "", children: "No parent" }), (categoriesFlatQuery.data ?? []).map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] }), _jsx(Input, { id: "category-icon", label: "Icon token", value: form.icon, onChange: (event) => setForm((prev) => ({ ...prev, icon: event.target.value })) }), _jsx(Input, { id: "category-color", label: "Color", value: form.color, onChange: (event) => setForm((prev) => ({ ...prev, color: event.target.value })) })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', marginTop: '1rem' }, children: [_jsx(Button, { type: "button", onClick: () => saveMutation.mutate(), disabled: saveMutation.isPending || !form.name.trim(), children: form.id ? 'Update category' : 'Create category' }), form.id && (_jsx(Button, { type: "button", variant: "secondary", onClick: () => setForm(emptyForm), children: "Cancel" }))] })] }), _jsx(Card, { title: "Category Tree", children: categoriesTreeQuery.data && categoriesTreeQuery.data.length > 0 ? (_jsx(CategoryTree, { categories: categoriesTreeQuery.data, onEdit: loadForEdit, onDelete: (id) => deleteMutation.mutate(id) })) : (_jsx(EmptyState, { title: "No categories", description: "Create your first custom category to begin." })) })] }));
}
