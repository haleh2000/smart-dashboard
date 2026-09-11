import { Navigate } from 'react-router';
import { useCan } from '@/modules/auth';
import { EmptyState } from '@/shared/ui';
import { navigation } from '../navigation';

/** Sends each role to the first section it may see (agents have no dashboard). */
export function HomeRedirect() {
  const can = useCan();
  const first = navigation.find((item) => can(item.permission));
  return first ? (
    <Navigate to={first.path} replace />
  ) : (
    <EmptyState message="بخشی برای نقش شما تعریف نشده است." />
  );
}
