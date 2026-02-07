import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function CategoryPicker({ categories, value, disabled, onChange }) {
    return (_jsxs("select", { className: "select", "aria-label": "Category", value: value ?? '', onChange: (event) => onChange(event.target.value ? Number(event.target.value) : undefined), disabled: disabled, children: [_jsx("option", { value: "", children: "Uncategorized" }), categories.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] }));
}
