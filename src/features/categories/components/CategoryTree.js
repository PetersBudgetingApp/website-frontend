import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@shared/ui/Button';
function renderNodes(categories, handlers, depth = 0) {
    return categories.map((category) => (_jsxs("div", { style: { marginLeft: `${depth * 14}px`, padding: '0.3rem 0' }, children: [_jsxs("div", { style: { display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("strong", { children: category.name }), _jsx("span", { className: "subtle", style: { marginLeft: '0.4rem' }, children: category.categoryType }), category.system && (_jsx("span", { className: "subtle", style: { marginLeft: '0.4rem' }, children: "system" }))] }), !category.system && (_jsxs("div", { style: { display: 'flex', gap: '0.4rem' }, children: [_jsx(Button, { type: "button", variant: "ghost", onClick: () => handlers.onEdit(category.id), children: "Edit" }), _jsx(Button, { type: "button", variant: "danger", onClick: () => handlers.onDelete(category.id), children: "Delete" })] }))] }), category.children && category.children.length > 0 && renderNodes(category.children, handlers, depth + 1)] }, category.id)));
}
export function CategoryTree({ categories, onEdit, onDelete }) {
    return _jsx("div", { children: renderNodes(categories, { onEdit, onDelete }) });
}
