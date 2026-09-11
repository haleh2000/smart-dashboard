import { useState } from 'react';
import { PERMISSIONS, permissionLabels } from '@/modules/auth';
import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import {
  ActionMenu,
  Button,
  Dialog,
  ErrorState,
  PageHeader,
  SkeletonTable,
  StatusBadge,
} from '@/shared/ui';
import { isLockedPermission, type RoleDefinition } from '../../domain/roleDefinition';
import { roleToneOf } from '../adminLabels';
import { RoleFormDialog } from '../components/RoleFormDialog';
import {
  useRemoveRole,
  useRoleCounts,
  useRoles,
  useToggleRolePermission,
} from '../hooks/adminQueries';
import './RolesPage.css';

type Editing = { mode: 'create' } | { mode: 'edit'; role: RoleDefinition } | null;

function RoleCard({
  role,
  userCount,
  onEdit,
  onDelete,
}: {
  role: RoleDefinition;
  userCount?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={cn('roles__card', !role.system && 'roles__card--custom')}>
      <header className="roles__card-header">
        <StatusBadge tone={roleToneOf(role)}>{role.name}</StatusBadge>
        <ActionMenu
          label={`عملیات نقش ${role.name}`}
          items={[
            { label: 'ویرایش', onSelect: onEdit },
            ...(role.system ? [] : [{ label: 'حذف نقش', onSelect: onDelete, danger: true }]),
          ]}
        />
      </header>
      <p className="roles__description">{role.description || 'بدون توضیحات'}</p>
      <footer className="roles__card-footer">
        <span className="roles__meter" aria-hidden="true">
          <span
            className="roles__meter-fill"
            style={{ inlineSize: `${(role.permissions.length / PERMISSIONS.length) * 100}%` }}
          />
        </span>
        <span className="roles__count">
          {formatPersianNumber(role.permissions.length)} از{' '}
          {formatPersianNumber(PERMISSIONS.length)} دسترسی
        </span>
        {role.system ? (
          <span className="roles__count">
            {userCount === undefined ? '…' : formatPersianNumber(userCount)} کاربر فعال
          </span>
        ) : null}
        <span className={cn('roles__kind', role.system && 'roles__kind--system')}>
          {role.system ? 'سیستمی' : 'سفارشی'}
        </span>
      </footer>
    </article>
  );
}

function PermissionMatrix({ roles }: { roles: RoleDefinition[] }) {
  const toggle = useToggleRolePermission();
  const status = toggle.isPending
    ? { text: 'در حال ذخیره…', tone: 'pending' }
    : toggle.isError
      ? { text: 'ذخیره نشد؛ تغییر برگردانده شد.', tone: 'error' }
      : toggle.isSuccess
        ? { text: 'ذخیره شد', tone: 'success' }
        : null;

  return (
    <div className="roles__matrix-block">
      <div className="roles__matrix-toolbar">
        <h3 className="roles__section-title">ماتریس دسترسی</h3>
        <span
          className={cn('roles__save', status && `roles__save--${status.tone}`)}
          role="status"
          aria-live="polite"
        >
          {status?.text}
        </span>
      </div>
      <div className="queue-table-wrap">
        <table className="queue-table roles__matrix">
          <thead>
            <tr>
              <th scope="col">دسترسی</th>
              {roles.map((role) => (
                <th key={role.id} scope="col" className="roles__cell">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission}>
                <th scope="row" className="roles__permission">
                  {permissionLabels[permission]}
                </th>
                {roles.map((role) => {
                  const allowed = role.permissions.includes(permission);
                  const locked = isLockedPermission(role, permission);
                  return (
                    <td
                      key={role.id}
                      className={cn('roles__cell', allowed && 'roles__cell--on')}
                      data-label={role.name}
                    >
                      <input
                        type="checkbox"
                        className="roles__toggle"
                        checked={allowed}
                        disabled={locked}
                        title={locked ? 'این دسترسی برای نقش مدیر همیشه فعال است' : undefined}
                        aria-label={`${permissionLabels[permission]} — ${role.name}`}
                        onChange={() => toggle.mutate({ role, permission })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** «مدیریت نقش‌ها و دسترسی‌ها»: built-in and custom roles plus an editable RBAC matrix. */
export function RolesPage() {
  const { data: roles, isPending, isError, refetch } = useRoles();
  const { data: counts } = useRoleCounts();
  const remove = useRemoveRole();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<RoleDefinition | null>(null);

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <section className="roles">
      <PageHeader
        title="نقش‌ها و دسترسی‌ها"
        subtitle="تعریف نقش‌های سفارشی و تعیین دسترسی هر نقش بر اساس RBAC"
        actions={<Button onClick={() => setEditing({ mode: 'create' })}>نقش جدید</Button>}
      />

      {isPending ? (
        <SkeletonTable rows={6} />
      ) : isError ? (
        <ErrorState message="دریافت نقش‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="roles__cards">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                userCount={role.system && role.baseRole ? counts?.[role.baseRole] : undefined}
                onEdit={() => setEditing({ mode: 'edit', role })}
                onDelete={() => setDeleting(role)}
              />
            ))}
          </div>
          <PermissionMatrix roles={roles} />
          {editing && (
            <RoleFormDialog
              key={editing.mode === 'edit' ? editing.role.id : 'new'}
              open
              role={editing.mode === 'edit' ? editing.role : undefined}
              roles={roles}
              onClose={() => setEditing(null)}
            />
          )}
        </>
      )}

      <Dialog
        open={deleting !== null}
        title="حذف نقش"
        onClose={closeDelete}
        actions={
          <>
            <Button variant="ghost" onClick={closeDelete}>
              انصراف
            </Button>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
            >
              {remove.isPending ? 'در حال حذف…' : 'حذف'}
            </Button>
          </>
        }
      >
        <p className="roles__confirm">
          نقش «{deleting?.name}» حذف شود؟ کاربرانی که این نقش را دارند باید نقش دیگری بگیرند.
        </p>
        {remove.isError && (
          <p className="admin-form__banner" role="alert">
            حذف نقش ممکن نشد.
          </p>
        )}
      </Dialog>

      <p className="roles__note">
        تغییرات نقش‌ها ذخیره می‌شوند؛ اعمال قطعی دسترسی‌ها پس از اتصال به API در سمت سرور انجام
        می‌شود. تا آن زمان دسترسی واقعی کاربران از ماتریس پیش‌فرض RBAC خوانده می‌شود.
      </p>
    </section>
  );
}
