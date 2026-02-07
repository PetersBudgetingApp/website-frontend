import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ children, className = '', variant = 'primary', ...props }) {
    return (_jsx("button", { className: `btn btn-${variant} ${className}`.trim(), ...props, children: children }));
}
