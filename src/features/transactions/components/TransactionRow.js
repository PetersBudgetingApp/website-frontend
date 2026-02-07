import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { formatCurrency, formatDate } from '@domain/format';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { CategoryPicker } from '@features/transactions/components/CategoryPicker';
export function TransactionRow({ transaction, categories, onCategoryChange, onExcludeToggle, onNotesSave, disabled, }) {
    const [notes, setNotes] = useState(transaction.notes ?? '');
    return (_jsxs("tr", { children: [_jsx("td", { children: formatDate(transaction.postedAt) }), _jsxs("td", { children: [_jsx("div", { children: transaction.description ?? transaction.payee ?? 'Unknown' }), transaction.internalTransfer && _jsx(Badge, { children: "Transfer" })] }), _jsx("td", { children: transaction.accountName ?? 'Unknown account' }), _jsx("td", { className: `number ${transaction.amount < 0 ? '' : ''}`, children: formatCurrency(transaction.amount) }), _jsx("td", { children: _jsx(CategoryPicker, { categories: categories, value: transaction.category?.id ?? undefined, disabled: disabled, onChange: (categoryId) => onCategoryChange(transaction.id, categoryId) }) }), _jsx("td", { children: _jsxs("label", { style: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("input", { type: "checkbox", checked: transaction.excludeFromTotals, onChange: (event) => onExcludeToggle(transaction.id, event.target.checked), disabled: disabled }), "Exclude"] }) }), _jsx("td", { children: _jsxs("div", { className: "form-grid", style: { gridTemplateColumns: '1fr auto' }, children: [_jsx("input", { className: "input", value: notes, onChange: (event) => setNotes(event.target.value), placeholder: "Notes", disabled: disabled }), _jsx(Button, { type: "button", variant: "ghost", onClick: () => onNotesSave(transaction.id, notes), disabled: disabled, children: "Save" })] }) })] }));
}
