import type { Permission, Role } from '@/modules/auth';

/**
 * A role managed under «مدیریت نقش‌ها». The three built-in roles (agent / supervisor / admin)
 * are `system`: they can't be deleted or renamed, only their permissions change.
 * Field names are provisional; re-check them against api.yml.
 */
export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
  /** The built-in role a system role stands for, or the one a custom role was copied from. */
  baseRole?: Role;
  createdAt: Date;
}

export interface RoleInput {
  name: string;
  description: string;
  permissions: Permission[];
  baseRole?: Role;
}

export const ROLE_NAME_MAX_LENGTH = 40;

export type RoleField = 'name' | 'permissions';
export type RoleErrorCode = 'required' | 'tooLong' | 'duplicate' | 'noPermission';
export type RoleErrors = Partial<Record<RoleField, RoleErrorCode>>;

const normalizeName = (name: string) => name.trim().toLocaleLowerCase('fa');

/**
 * Validates the role form. `existing` are the roles already defined; `editingId` is skipped
 * so a role keeps its own name.
 */
export const validateRole = (
  input: RoleInput,
  existing: readonly Pick<RoleDefinition, 'id' | 'name'>[],
  editingId?: string,
): RoleErrors => {
  const errors: RoleErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'required';
  else if (name.length > ROLE_NAME_MAX_LENGTH) errors.name = 'tooLong';
  else if (
    existing.some(
      (role) => role.id !== editingId && normalizeName(role.name) === normalizeName(name),
    )
  )
    errors.name = 'duplicate';
  if (input.permissions.length === 0) errors.permissions = 'noPermission';
  return errors;
};

export const hasRoleErrors = (errors: RoleErrors) => Object.keys(errors).length > 0;

/** Permissions a role can never lose: the admin role keeps «مدیریت» so nobody is locked out. */
export const isLockedPermission = (
  role: Pick<RoleDefinition, 'baseRole' | 'system'>,
  permission: Permission,
) => role.system && role.baseRole === 'admin' && permission === 'admin.manage';

/** Adds or removes one permission, keeping locked ones. */
export const togglePermission = (
  role: Pick<RoleDefinition, 'baseRole' | 'system' | 'permissions'>,
  permission: Permission,
): Permission[] => {
  if (isLockedPermission(role, permission)) return role.permissions;
  return role.permissions.includes(permission)
    ? role.permissions.filter((p) => p !== permission)
    : [...role.permissions, permission];
};

/** Thrown by RoleRepository when deleting a built-in role. */
export class SystemRoleError extends Error {
  constructor() {
    super('System roles cannot be deleted');
    this.name = 'SystemRoleError';
  }
}
