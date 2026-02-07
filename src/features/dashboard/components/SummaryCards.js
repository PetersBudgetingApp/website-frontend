import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency, formatPercent } from '@domain/format';
import { Card } from '@shared/ui/Card';
export function SummaryCards({ netWorth, income, expenses, savingsRate }) {
    const items = [
        { label: 'Net Worth', value: formatCurrency(netWorth) },
        { label: 'Income', value: formatCurrency(income) },
        { label: 'Expenses', value: formatCurrency(expenses) },
        { label: 'Savings Rate', value: formatPercent(savingsRate) },
    ];
    return (_jsx("section", { className: "grid-cards", "aria-label": "Financial summary cards", children: items.map((item) => (_jsxs(Card, { children: [_jsx("p", { className: "subtle", children: item.label }), _jsx("p", { className: "number", style: { fontSize: '1.35rem', marginTop: '0.35rem' }, children: item.value })] }, item.label))) }));
}
