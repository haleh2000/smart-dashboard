import {
  PERMISSIONS,
  permissionLabels,
  permissionsOf,
  roleDescriptions,
  roleLabels,
  ROLES,
} from '@/modules/auth';
import { formatPersianNumber } from '@/shared/lib/format';
import { PageHeader, StatusBadge } from '@/shared/ui';
import { roleTones } from '../adminLabels';
import { useRoleCounts } from '../hooks/adminQueries';
import './RolesPage.css';

/** «دسترسی‌ها»: the RBAC matrix, read-only until the API manages roles. */
export function RolesPage() {
  const { data: counts } = useRoleCounts();

  return (
    <section className="roles">
      <PageHeader title="نقش‌ها و دسترسی‌ها" subtitle="دسترسی هر نقش بر اساس RBAC" />

      <div className="roles__cards">
        {ROLES.map((role) => (
          <article key={role} className="roles__card">
            <header className="roles__card-header">
              <StatusBadge tone={roleTones[role]}>{roleLabels[role]}</StatusBadge>
              <span className="roles__count">
                {counts ? formatPersianNumber(counts[role]) : '…'} کاربر فعال
              </span>
            </header>
            <p className="roles__description">{roleDescriptions[role]}</p>
          </article>
        ))}
      </div>

      <div className="queue-table-wrap">
        <table className="queue-table roles__matrix">
          <caption className="queue-table__caption">ماتریس دسترسی</caption>
          <thead>
            <tr>
              <th scope="col">دسترسی</th>
              {ROLES.map((role) => (
                <th key={role} scope="col" className="roles__cell">
                  {roleLabels[role]}
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
                {ROLES.map((role) => {
                  const allowed = permissionsOf(role).includes(permission);
                  return (
                    <td
                      key={role}
                      className={allowed ? 'roles__cell roles__cell--on' : 'roles__cell'}
                      data-label={roleLabels[role]}
                    >
                      <span aria-label={allowed ? 'دارد' : 'ندارد'}>{allowed ? '✓' : '—'}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="roles__note">
        قوانین دسترسی در سرور و ماتریس RBAC اعمال می‌شوند. ویرایش نقش‌ها و دسترسی‌ها پس از اتصال به
        API فعال خواهد شد.
      </p>
    </section>
  );
}
