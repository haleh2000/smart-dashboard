import { ROLES, type Role } from '../domain/role';

/**
 * Development-only session storage used by MockAuthRepository until the real auth API
 * exists: the signed-in mobile plus a role override for trying RBAC.
 */
const ROLE_KEY = 'smart.devRole';
const SESSION_KEY = 'smart.devSession';

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode) — the session lasts for this page only
  }
};

export const getDevRole = (): Role => ROLES.find((role) => role === read(ROLE_KEY)) ?? 'supervisor';
export const setDevRole = (role: Role) => write(ROLE_KEY, role);

export const getDevSessionMobile = () => read(SESSION_KEY);
export const setDevSessionMobile = (mobile: string | null) => write(SESSION_KEY, mobile);
