import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { EmptyState, ErrorState } from '@/shared/ui';

export function RouteErrorPage() {
  const error = useRouteError();
  // No error means this was rendered by the catch-all "*" route.
  const notFound = !error || (isRouteErrorResponse(error) && error.status === 404);

  if (notFound)
    return (
      <EmptyState mascot message="صفحه‌ای که دنبالش هستید پیدا نشد.">
        <Link className="btn btn--ghost" to="/">
          بازگشت به خانه
        </Link>
      </EmptyState>
    );
  return (
    <ErrorState message="خطای غیرمنتظره‌ای رخ داد." onRetry={() => window.location.reload()} />
  );
}
