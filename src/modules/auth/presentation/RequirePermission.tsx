import type { ReactNode } from 'react';
import { EmptyState } from '@/shared/ui';
import type { Permission } from '../domain/permission';
import { useCan } from './currentUser';

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const can = useCan();
  if (!can(permission))
    return <EmptyState message="نقش کاربری شما اجازه مشاهده این بخش را ندارد." />;
  return children;
}
