import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentMonthKey, formatCurrency } from '@domain/format';
import { getAccountSummary, getCashFlow, getSpendingByCategory, getCategories } from '@shared/api/endpoints';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';
import { useAuth } from '@shared/hooks/useAuth';
import { monthToDateRange } from '@shared/utils/date';
import { localBudgetStore } from '@features/budgets/budgetStore';
import { SummaryCards } from '@features/dashboard/components/SummaryCards';
export function DashboardPage() {
    const auth = useAuth();
    const month = getCurrentMonthKey();
    const { startDate, endDate } = monthToDateRange(month);
    const accountSummaryQuery = useQuery({
        queryKey: ['accounts', 'summary'],
        queryFn: getAccountSummary,
    });
    const cashFlowQuery = useQuery({
        queryKey: ['analytics', 'cashflow', startDate, endDate],
        queryFn: () => getCashFlow(startDate, endDate),
    });
    const spendingQuery = useQuery({
        queryKey: ['analytics', 'spending', startDate, endDate],
        queryFn: () => getSpendingByCategory(startDate, endDate),
    });
    const categoriesQuery = useQuery({
        queryKey: ['categories', 'flat'],
        queryFn: () => getCategories(true),
    });
    const budgetSummary = useMemo(() => {
        if (!auth.user || !spendingQuery.data || !categoriesQuery.data) {
            return { target: 0, actual: 0, overspentCount: 0 };
        }
        const targets = localBudgetStore.getMonthTargets(auth.user.id, month);
        const actualByCategory = new Map();
        spendingQuery.data.categories.forEach((item) => {
            if (item.categoryId !== null && item.categoryId !== undefined) {
                actualByCategory.set(item.categoryId, item.amount);
            }
        });
        const performance = localBudgetStore.getPerformance({
            categories: categoriesQuery.data.map((category) => ({ id: category.id, name: category.name })),
            targets,
            actualByCategory,
        });
        return {
            target: performance.reduce((sum, item) => sum + item.targetAmount, 0),
            actual: performance.reduce((sum, item) => sum + item.actualAmount, 0),
            overspentCount: performance.filter((item) => item.status === 'over').length,
        };
    }, [auth.user, spendingQuery.data, categoriesQuery.data, month]);
    if (accountSummaryQuery.isLoading || cashFlowQuery.isLoading || spendingQuery.isLoading) {
        return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Dashboard" }), _jsx(Spinner, {})] }));
    }
    if (!accountSummaryQuery.data || !cashFlowQuery.data || !spendingQuery.data) {
        return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Dashboard" }), _jsx(EmptyState, { title: "Could not load dashboard", description: "Try refreshing after your next sync." })] }));
    }
    return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Dashboard" }), _jsx(SummaryCards, { netWorth: accountSummaryQuery.data.netWorth, income: cashFlowQuery.data.totalIncome, expenses: cashFlowQuery.data.totalExpenses, savingsRate: cashFlowQuery.data.savingsRate }), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: '2fr 1fr' }, children: [_jsx(Card, { title: "Spending by Category (Current Month)", children: spendingQuery.data.categories.length === 0 ? (_jsx(EmptyState, { title: "No spending yet", description: "Transactions will appear after sync." })) : (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Category" }), _jsx("th", { children: "Amount" }), _jsx("th", { children: "%" })] }) }), _jsx("tbody", { children: spendingQuery.data.categories.slice(0, 8).map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.categoryName }), _jsx("td", { className: "number", children: formatCurrency(item.amount) }), _jsxs("td", { className: "number", children: [item.percentage.toFixed(1), "%"] })] }, `${item.categoryName}-${item.categoryId ?? 'none'}`))) })] })) }), _jsx(Card, { title: "Budget Progress", children: _jsxs("div", { className: "form-grid", children: [_jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Targeted Spend" }), _jsx("p", { className: "number", children: formatCurrency(budgetSummary.target) })] }), _jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Actual Spend" }), _jsx("p", { className: "number", children: formatCurrency(budgetSummary.actual) })] }), _jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Overspent Categories" }), _jsx("p", { className: "number", children: budgetSummary.overspentCount })] })] }) })] })] }));
}
