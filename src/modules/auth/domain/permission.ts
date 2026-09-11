import type { Role } from './role';

export const PERMISSIONS = [
  'dashboard.view', // dashboard incl. analytics & reports
  'tickets.view',
  'calls.view',
  'customers.view',
  'admin.manage', // users, roles, settings, integrations
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** RBAC matrix from README → "نقش‌های کاربری". Change access rules here only. */
const rolePermissions: Record<Role, readonly Permission[]> = {
  agent: ['tickets.view', 'calls.view', 'customers.view'],
  supervisor: ['dashboard.view', 'tickets.view', 'calls.view', 'customers.view'],
  admin: PERMISSIONS,
};

export const hasPermission = (role: Role, permission: Permission) =>
  rolePermissions[role].includes(permission);
