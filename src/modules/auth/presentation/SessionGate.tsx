import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ErrorState, MascotLoader } from '@/shared/ui';
import { CurrentUserContext } from './currentUser';
import { authPaths } from './authPaths';
import { useCurrentUserQuery } from './sessionQueries';

/**
 * Loads the signed-in user once; everything below it can rely on useCurrentUser().
 * Anonymous visitors are sent to the login page and come back to where they were.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: user, isPending, isError, refetch } = useCurrentUserQuery();

  if (isPending) return <MascotLoader />;
  if (isError) return <ErrorState message="اطلاعات کاربر دریافت نشد." onRetry={() => refetch()} />;
  if (!user)
    return (
      <Navigate
        to={authPaths.login}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );

  return <CurrentUserContext value={user}>{children}</CurrentUserContext>;
}
