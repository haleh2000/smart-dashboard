import { createContext, use } from 'react';
import { hasPermission, type Permission } from '../domain/permission';
import type { User } from '../domain/user';

export const CurrentUserContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const user = use(CurrentUserContext);
  if (!user) throw new Error('useCurrentUser must be used inside <SessionGate>.');
  return user;
}

/** Returns a permission checker for the signed-in user's role. */
export function useCan() {
  const { role } = useCurrentUser();
  return (permission: Permission) => hasPermission(role, permission);
}
