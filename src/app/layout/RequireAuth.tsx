import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { appRoutes } from '@app/routes';
import { useAuth } from '@shared/hooks/useAuth';

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return (
      <main className="page center-page">
        <p>Restoring session...</p>
      </main>
    );
  }

  if (auth.status !== 'authenticated') {
    return <Navigate to={appRoutes.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
