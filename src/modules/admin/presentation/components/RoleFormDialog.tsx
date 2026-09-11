import { useId, useState, type FormEvent } from 'react';
import {
  permissionLabels,
  permissionsOf,
  ROLES,
  roleLabels,
  type Permission,
  type Role,
} from '@/modules/auth';
import { cn } from '@/shared/lib/cn';
import { Button, Dialog } from '@/shared/ui';
import {
  hasRoleErrors,
  isLockedPermission,
  ROLE_NAME_MAX_LENGTH,
  togglePermission,
  validateRole,
  type RoleDefinition,
  type RoleErrors,
  type RoleInput,
} from '../../domain/roleDefinition';
import { permissionGroups, permissionHints, roleErrorMessages } from '../adminLabels';
import { useSaveRole } from '../hooks/adminQueries';
import './AdminForms.css';
import './RoleFormDialog.css';

interface RoleFormDialogProps {
  open: boolean;
  /** Edits this role; creates a new one when absent. */
  role?: RoleDefinition;
  /** Every role, for the unique-name check. */
  roles: readonly RoleDefinition[];
  onClose: () => void;
}

/** Create / edit a role. Mount with a `key` per role so the draft resets between roles. */
export function RoleFormDialog({ open, role, roles, onClose }: RoleFormDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<RoleInput>(
    role
      ? {
          name: role.name,
          description: role.description,
          permissions: [...role.permissions],
          baseRole: role.baseRole,
        }
      : { name: '', description: '', permissions: [] },
  );
  const [errors, setErrors] = useState<RoleErrors>({});
  const save = useSaveRole();
  const nameLocked = Boolean(role?.system);
  // The lock rule needs the role's identity; a new role never has locked permissions.
  const lockTarget = role ?? { system: false };

  const setBase = (value: string) => {
    const baseRole = (ROLES as readonly string[]).includes(value) ? (value as Role) : undefined;
    setDraft((current) => ({
      ...current,
      baseRole,
      permissions: baseRole ? [...permissionsOf(baseRole)] : current.permissions,
    }));
  };

  const toggle = (permission: Permission) =>
    setDraft((current) => ({
      ...current,
      permissions: togglePermission(
        { ...lockTarget, permissions: current.permissions },
        permission,
      ),
    }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input: RoleInput = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
    };
    const found = validateRole(input, roles, role?.id);
    setErrors(found);
    if (hasRoleErrors(found)) return;
    save.mutate({ id: role?.id, input }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={open}
      title={role ? `ویرایش نقش «${role.name}»` : 'نقش جدید'}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={save.isPending}>
            {save.isPending ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} className="admin-form" onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor={`${id}-name`} className="form-field__label form-field__label--required">
            نام نقش
          </label>
          <input
            id={`${id}-name`}
            className="form-input"
            value={draft.name}
            maxLength={ROLE_NAME_MAX_LENGTH + 10}
            readOnly={nameLocked}
            onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
          />
          {nameLocked && (
            <span className="role-form__hint">نام نقش‌های سیستمی قابل تغییر نیست.</span>
          )}
          {errors.name && (
            <span id={`${id}-name-error`} className="admin-form__error" role="alert">
              {roleErrorMessages[errors.name]}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${id}-description`} className="form-field__label">
            توضیحات
          </label>
          <textarea
            id={`${id}-description`}
            className="form-input role-form__textarea"
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
          />
        </div>

        {!role?.system && (
          <label className="form-field">
            <span className="form-field__label">بر پایه نقش</span>
            <select
              className="form-select"
              value={draft.baseRole ?? ''}
              onChange={(e) => setBase(e.target.value)}
            >
              <option value="">بدون نقش پایه</option>
              {ROLES.map((base) => (
                <option key={base} value={base}>
                  {roleLabels[base]} — کپی دسترسی‌ها
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset
          className="role-form__permissions"
          aria-invalid={Boolean(errors.permissions)}
          aria-describedby={errors.permissions ? `${id}-perm-error` : undefined}
        >
          <legend className="form-field__label form-field__label--required">دسترسی‌ها</legend>
          {permissionGroups.map((group) => (
            <div key={group.title} className="role-form__group">
              <span className="role-form__group-title">{group.title}</span>
              {group.permissions.map((permission) => {
                const checked = draft.permissions.includes(permission);
                const locked = isLockedPermission(lockTarget, permission);
                return (
                  <label
                    key={permission}
                    className={cn('role-form__option', checked && 'role-form__option--on')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(permission)}
                    />
                    <span className="role-form__option-text">
                      <span className="role-form__option-label">
                        {permissionLabels[permission]}
                      </span>
                      <span className="role-form__hint">
                        {locked
                          ? 'برای جلوگیری از قفل شدن سیستم، همیشه فعال است.'
                          : permissionHints[permission]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
          {errors.permissions && (
            <span id={`${id}-perm-error`} className="admin-form__error" role="alert">
              {roleErrorMessages[errors.permissions]}
            </span>
          )}
        </fieldset>

        {save.isError && (
          <p className="admin-form__banner" role="alert">
            ذخیره نقش با خطا مواجه شد. لطفاً دوباره تلاش کنید.
          </p>
        )}
      </form>
    </Dialog>
  );
}
