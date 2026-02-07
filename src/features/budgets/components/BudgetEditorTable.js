import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency } from '@domain/format';
import { Button } from '@shared/ui/Button';
export function BudgetEditorTable({ categories, targetsByCategory, actualByCategory, onTargetChange, onDeleteTarget, }) {
    return (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Category" }), _jsx("th", { children: "Target" }), _jsx("th", { children: "Actual" }), _jsx("th", { children: "Variance" }), _jsx("th", { children: "Notes" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: categories.map((category) => {
                    const target = targetsByCategory[category.id];
                    const targetAmount = target?.targetAmount ?? 0;
                    const notes = target?.notes ?? '';
                    const actual = actualByCategory.get(category.id) ?? 0;
                    const variance = targetAmount - actual;
                    return (_jsxs("tr", { children: [_jsx("td", { children: category.name }), _jsx("td", { children: _jsx("input", { className: "input number", type: "number", min: "0", step: "0.01", value: targetAmount === 0 ? '' : targetAmount, onChange: (event) => onTargetChange(category.id, 'targetAmount', event.target.value) }) }), _jsx("td", { className: "number", children: formatCurrency(actual) }), _jsx("td", { className: `number ${variance < 0 ? 'field-error' : ''}`, children: formatCurrency(variance) }), _jsx("td", { children: _jsx("input", { className: "input", value: notes, onChange: (event) => onTargetChange(category.id, 'notes', event.target.value), placeholder: "Optional" }) }), _jsx("td", { children: _jsx(Button, { type: "button", variant: "ghost", onClick: () => onDeleteTarget(category.id), children: "Clear" }) })] }, category.id));
                }) })] }));
}
