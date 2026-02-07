import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Input = forwardRef(function Input({ label, error, id, className = '', ...props }, ref) {
    return (_jsxs("label", { className: "field", htmlFor: id, children: [label && _jsx("span", { className: "field-label", children: label }), _jsx("input", { ref: ref, id: id, className: `input ${className}`.trim(), ...props }), error && _jsx("span", { className: "field-error", children: error })] }));
});
