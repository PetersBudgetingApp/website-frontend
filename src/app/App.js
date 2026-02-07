import { jsx as _jsx } from "react/jsx-runtime";
import { RouterProvider } from 'react-router-dom';
import { router } from '@app/router';
export function App() {
    return _jsx(RouterProvider, { router: router });
}
