import { ROLES, type Role } from '@/modules/auth';
import { delay } from '@/mocks/delay';
import { mockUsers } from '@/mocks/users';
import type { Page } from '@/shared/domain/pagination';
import type { UserQuery, UserRepository } from '../domain/AdminRepositories';
import { DuplicateMobileError, type StaffUser, type StaffUserInput } from '../domain/staffUser';

const matchesSearch = (user: StaffUser, term: string) =>
  [user.fullName, user.mobile, user.email ?? ''].some((value) => value.includes(term));

/** In-memory adapter. Filtering/paging here mimics what the backend is expected to do. */
export class MockUserRepository implements UserRepository {
  private users: StaffUser[];
  private sequence: number;

  constructor(users: StaffUser[] = mockUsers) {
    this.users = users.map((user) => ({ ...user }));
    this.sequence = users.length;
  }

  async list({ page, pageSize, search, role, active }: UserQuery): Promise<Page<StaffUser>> {
    await delay();
    const term = search?.trim();
    const filtered = this.users
      .filter(
        (user) =>
          (!term || matchesSearch(user, term)) &&
          (!role || user.role === role) &&
          (active === undefined || user.active === active),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  private assertUniqueMobile(mobile: string, exceptId?: string) {
    if (this.users.some((user) => user.mobile === mobile && user.id !== exceptId))
      throw new DuplicateMobileError();
  }

  async create(input: StaffUserInput): Promise<StaffUser> {
    await delay();
    this.assertUniqueMobile(input.mobile);
    this.sequence += 1;
    const user: StaffUser = {
      ...input,
      email: input.email || undefined,
      id: `u-${this.sequence}`,
      active: true,
      createdAt: new Date(),
    };
    this.users = [user, ...this.users];
    return user;
  }

  private replace(id: string, change: (user: StaffUser) => StaffUser) {
    const current = this.users.find((user) => user.id === id);
    if (!current) throw new Error(`User ${id} not found`);
    const next = change(current);
    this.users = this.users.map((user) => (user.id === id ? next : user));
    return next;
  }

  async update(id: string, input: StaffUserInput): Promise<StaffUser> {
    await delay();
    this.assertUniqueMobile(input.mobile, id);
    return this.replace(id, (user) => ({ ...user, ...input, email: input.email || undefined }));
  }

  async setActive(id: string, active: boolean): Promise<StaffUser> {
    await delay(150);
    return this.replace(id, (user) => ({ ...user, active }));
  }

  async countByRole(): Promise<Record<Role, number>> {
    await delay(150);
    const counts = Object.fromEntries(ROLES.map((role) => [role, 0])) as Record<Role, number>;
    for (const user of this.users) if (user.active) counts[user.role] += 1;
    return counts;
  }
}
