import { useQueryClient } from '@tanstack/react-query';
import { ROLES, roleLabels, setDevRole, useCurrentUser, type Role } from '@/modules/auth';
import './DevRoleSwitcher.css';

/** Development-only: switch the mock user's role to try RBAC. Remove together with MockAuthRepository. */
export function DevRoleSwitcher() {
  const { role } = useCurrentUser();
  const queryClient = useQueryClient();

  return (
    <label className="dev-role">
      <span className="dev-role__label">نقش (dev)</span>
      <select
        className="dev-role__select"
        value={role}
        onChange={(event) => {
          setDevRole(event.target.value as Role);
          void queryClient.resetQueries();
        }}
      >
        {ROLES.map((value) => (
          <option key={value} value={value}>
            {roleLabels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
