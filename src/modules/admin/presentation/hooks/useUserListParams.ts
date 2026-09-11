import { useSearchParams } from 'react-router';
import { ROLES } from '@/modules/auth';
import type { UserQuery } from '../../domain/AdminRepositories';

const PAGE_SIZE = 20;

type Changes = Partial<Pick<UserQuery, 'page' | 'search' | 'role' | 'active'>>;

/** User list filters live in the URL so reloads and links keep the same view. */
export function useUserListParams() {
  const [params, setParams] = useSearchParams();

  const role = params.get('role');
  const status = params.get('status');
  const query: UserQuery = {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
    search: params.get('q') ?? undefined,
    role: ROLES.find((r) => r === role),
    active: status === 'active' ? true : status === 'inactive' ? false : undefined,
  };

  const update = (changes: Changes) => {
    const next = { ...query, page: 1, ...changes };
    const entries: Record<string, string | undefined> = {
      page: next.page > 1 ? String(next.page) : undefined,
      q: next.search || undefined,
      role: next.role,
      status: next.active === undefined ? undefined : next.active ? 'active' : 'inactive',
    };
    setParams(
      Object.fromEntries(Object.entries(entries).filter(([, v]) => v !== undefined)) as Record<
        string,
        string
      >,
    );
  };

  return { query, update };
}
