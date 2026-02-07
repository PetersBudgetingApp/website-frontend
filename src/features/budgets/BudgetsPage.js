import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatMonth, getCurrentMonthKey } from '@domain/format';
import { getCategories, getSpendingByCategory, getTransactions } from '@shared/api/endpoints';
import { useAuth } from '@shared/hooks/useAuth';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { monthToDateRange } from '@shared/utils/date';
import { localBudgetStore } from '@features/budgets/budgetStore';
import { BudgetEditorTable } from '@features/budgets/components/BudgetEditorTable';
function listMonths(count = 12) {
    const values = [];
    const now = new Date();
    for (let i = 0; i < count; i += 1) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, '0')}`;
        values.push(key);
    }
    return values;
}
export function BudgetsPage() {
    const auth = useAuth();
    const [month, setMonth] = useState(getCurrentMonthKey());
    const [targetsByCategory, setTargetsByCategory] = useState({});
    const [saveMessage, setSaveMessage] = useState(null);
    const { startDate, endDate } = monthToDateRange(month);
    const categoriesQuery = useQuery({
        queryKey: ['categories', 'flat'],
        queryFn: () => getCategories(true),
    });
    const spendingQuery = useQuery({
        queryKey: ['analytics', 'spending', startDate, endDate],
        queryFn: () => getSpendingByCategory(startDate, endDate),
    });
    const uncategorizedQuery = useQuery({
        queryKey: ['transactions', 'uncategorized', startDate, endDate],
        queryFn: () => getTransactions({
            includeTransfers: false,
            startDate,
            endDate,
            limit: 500,
            offset: 0,
        }),
    });
    const expenseCategories = useMemo(() => (categoriesQuery.data ?? []).filter((item) => item.categoryType === 'EXPENSE'), [categoriesQuery.data]);
    const actualByCategory = useMemo(() => {
        const map = new Map();
        spendingQuery.data?.categories.forEach((item) => {
            if (item.categoryId !== null && item.categoryId !== undefined) {
                map.set(item.categoryId, item.amount);
            }
        });
        return map;
    }, [spendingQuery.data]);
    const uncategorizedCount = useMemo(() => (uncategorizedQuery.data ?? []).filter((item) => item.amount < 0 && !item.category).length, [uncategorizedQuery.data]);
    useEffect(() => {
        if (!auth.user) {
            return;
        }
        const targets = localBudgetStore.getMonthTargets(auth.user.id, month);
        const map = {};
        targets.forEach((target) => {
            map[target.categoryId] = target;
        });
        setTargetsByCategory(map);
    }, [auth.user, month]);
    const targetList = useMemo(() => Object.values(targetsByCategory).filter((target) => target.targetAmount > 0 || (target.notes ?? '').trim().length > 0), [targetsByCategory]);
    const performance = useMemo(() => {
        return localBudgetStore.getPerformance({
            categories: expenseCategories.map((item) => ({ id: item.id, name: item.name })),
            targets: targetList,
            actualByCategory,
        });
    }, [expenseCategories, targetList, actualByCategory]);
    const saveTargets = () => {
        if (!auth.user) {
            return;
        }
        localBudgetStore.saveMonthTargets(auth.user.id, month, targetList);
        setSaveMessage(`Saved ${targetList.length} targets for ${formatMonth(month)}.`);
    };
    const deleteTarget = (categoryId) => {
        if (!auth.user) {
            return;
        }
        localBudgetStore.deleteTarget(auth.user.id, month, categoryId);
        setTargetsByCategory((prev) => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
        });
    };
    if (!categoriesQuery.data || !spendingQuery.data) {
        return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Budgets" }), _jsx("p", { children: "Loading budget data..." })] }));
    }
    return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Budgets" }), _jsxs(Card, { title: "Monthly Targets", actions: _jsx("strong", { children: formatMonth(month) }), children: [_jsxs("div", { style: { display: 'flex', gap: '0.7rem', alignItems: 'end', marginBottom: '0.9rem', flexWrap: 'wrap' }, children: [_jsxs("label", { className: "field", htmlFor: "month-select", style: { maxWidth: '220px' }, children: [_jsx("span", { className: "field-label", children: "Month" }), _jsx("select", { id: "month-select", className: "select", value: month, onChange: (event) => setMonth(event.target.value), children: listMonths().map((monthKey) => (_jsx("option", { value: monthKey, children: formatMonth(monthKey) }, monthKey))) })] }), _jsx(Button, { type: "button", onClick: saveTargets, children: "Save Monthly Targets" }), saveMessage && _jsx("p", { className: "subtle", children: saveMessage })] }), expenseCategories.length > 0 ? (_jsx(BudgetEditorTable, { categories: expenseCategories, targetsByCategory: targetsByCategory, actualByCategory: actualByCategory, onDeleteTarget: deleteTarget, onTargetChange: (categoryId, field, value) => {
                            const categoryName = expenseCategories.find((item) => item.id === categoryId)?.name ?? 'Unknown';
                            setTargetsByCategory((prev) => {
                                const base = prev[categoryId] ?? {
                                    categoryId,
                                    categoryName,
                                    targetAmount: 0,
                                    notes: '',
                                };
                                return {
                                    ...prev,
                                    [categoryId]: {
                                        ...base,
                                        [field]: field === 'targetAmount' ? Number(value || 0) : value,
                                    },
                                };
                            });
                        } })) : (_jsx(EmptyState, { title: "No expense categories", description: "Create or sync categories before setting budgets." }))] }), _jsx(Card, { title: "Budget vs Actual", children: performance.length > 0 ? (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Category" }), _jsx("th", { children: "Target" }), _jsx("th", { children: "Actual" }), _jsx("th", { children: "Variance" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: performance.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.categoryName }), _jsx("td", { className: "number", children: formatCurrency(row.targetAmount) }), _jsx("td", { className: "number", children: formatCurrency(row.actualAmount) }), _jsx("td", { className: `number ${row.varianceAmount < 0 ? 'field-error' : ''}`, children: formatCurrency(row.varianceAmount) }), _jsx("td", { children: row.status })] }, row.categoryId))) })] })) : (_jsx(EmptyState, { title: "No targets yet", description: "Set monthly category targets to start comparisons." })) }), _jsx(Card, { title: "Uncategorized Spending Warning", children: uncategorizedCount > 0 ? (_jsxs("p", { children: [uncategorizedCount, " uncategorized spending transactions found for ", formatMonth(month), ". Categorize these so budget insights stay accurate."] })) : (_jsx("p", { className: "subtle", children: "No uncategorized spending for this month." })) })] }));
}
