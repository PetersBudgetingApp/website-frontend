import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Select = forwardRef(function Select({ label, error, className = '', id, children, ...props }, ref) {
    return (_jsxs("label", { className: "field", htmlFor: id, children: [label && _jsx("span", { className: "field-label", children: label }), _jsx("select", { ref: ref, id: id, className: `select ${className}`.trim(), ...props, children: children }), error && _jsx("span", { className: "field-error", children: error })] }));
});
