import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Card({ title, actions, className = '', children }) {
    return (_jsxs("section", { className: `card ${className}`.trim(), children: [(title || actions) && (_jsxs("header", { className: "card-header", children: [title && _jsx("h3", { children: title }), actions] })), _jsx("div", { className: "card-body", children: children })] }));
}
