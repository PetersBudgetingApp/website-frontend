import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/query/queryClient';
import { restoreSession } from '@shared/auth/authApi';
import { setAnonymous } from '@shared/auth/sessionStore';
export function AppProviders({ children }) {
    useEffect(() => {
        restoreSession().catch(() => setAnonymous());
    }, []);
    return _jsx(QueryClientProvider, { client: queryClient, children: children });
}
