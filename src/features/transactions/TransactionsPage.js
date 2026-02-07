import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultTransactionFilters } from '@domain/transactions';
import { getAccounts, getCategories, getTransactions, updateTransaction } from '@shared/api/endpoints';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { TransactionRow } from '@features/transactions/components/TransactionRow';
export function TransactionsPage() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(defaultTransactionFilters());
    const accountsQuery = useQuery({
        queryKey: ['accounts'],
        queryFn: getAccounts,
    });
    const categoriesQuery = useQuery({
        queryKey: ['categories', 'flat'],
        queryFn: () => getCategories(true),
    });
    const transactionsQuery = useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => getTransactions(filters),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateTransaction(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
    const categoryOptions = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Transactions" }), _jsx(Card, { title: "Filters", children: _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }, children: [_jsx(Input, { id: "start-date", type: "date", label: "Start", value: filters.startDate ?? '', onChange: (event) => setFilters((prev) => ({ ...prev, startDate: event.target.value || undefined, offset: 0 })) }), _jsx(Input, { id: "end-date", type: "date", label: "End", value: filters.endDate ?? '', onChange: (event) => setFilters((prev) => ({ ...prev, endDate: event.target.value || undefined, offset: 0 })) }), _jsxs(Select, { id: "account-filter", label: "Account", value: filters.accountId ?? '', onChange: (event) => setFilters((prev) => ({ ...prev, accountId: event.target.value ? Number(event.target.value) : undefined, offset: 0 })), children: [_jsx("option", { value: "", children: "All accounts" }), accountsQuery.data?.map((account) => (_jsx("option", { value: account.id, children: account.name }, account.id)))] }), _jsxs(Select, { id: "category-filter", label: "Category", value: filters.categoryId ?? '', onChange: (event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : undefined, offset: 0 })), children: [_jsx("option", { value: "", children: "All categories" }), categoryOptions.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] }), _jsxs("label", { className: "field", htmlFor: "include-transfers", children: [_jsx("span", { className: "field-label", children: "Transfers" }), _jsxs("label", { style: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: '42px' }, children: [_jsx("input", { id: "include-transfers", type: "checkbox", checked: filters.includeTransfers, onChange: (event) => setFilters((prev) => ({ ...prev, includeTransfers: event.target.checked, offset: 0 })) }), "Include internal transfers"] })] })] }) }), _jsx(Card, { title: "Unified Transactions", children: transactionsQuery.data && transactionsQuery.data.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Description" }), _jsx("th", { children: "Account" }), _jsx("th", { children: "Amount" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Totals" }), _jsx("th", { children: "Notes" })] }) }), _jsx("tbody", { children: transactionsQuery.data.map((transaction) => (_jsx(TransactionRow, { transaction: transaction, categories: categoryOptions, disabled: updateMutation.isPending, onCategoryChange: (transactionId, categoryId) => updateMutation.mutate({ id: transactionId, payload: { categoryId } }), onExcludeToggle: (transactionId, excludeFromTotals) => updateMutation.mutate({ id: transactionId, payload: { excludeFromTotals } }), onNotesSave: (transactionId, notes) => updateMutation.mutate({ id: transactionId, payload: { notes } }) }, transaction.id))) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }, children: [_jsx(Button, { variant: "secondary", onClick: () => setFilters((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) })), disabled: filters.offset === 0, children: "Previous" }), _jsx(Button, { variant: "secondary", onClick: () => setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit })), disabled: (transactionsQuery.data?.length ?? 0) < filters.limit, children: "Next" })] })] })) : (_jsx(EmptyState, { title: "No transactions", description: "Adjust filters or run a sync in Connections." })) })] }));
}
