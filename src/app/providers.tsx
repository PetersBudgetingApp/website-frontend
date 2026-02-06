import { PropsWithChildren, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/query/queryClient';
import { restoreSession } from '@shared/auth/authApi';
import { setAnonymous } from '@shared/auth/sessionStore';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    restoreSession().catch(() => setAnonymous());
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
