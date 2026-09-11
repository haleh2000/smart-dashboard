import { mockUsers } from '@/mocks/users';
import { DuplicateMobileError } from '../domain/staffUser';
import { MockUserRepository } from './MockUserRepository';

const input = {
  fullName: 'کاربر تازه',
  mobile: '09350000000',
  role: 'agent' as const,
  team: 'درمان',
};

describe('MockUserRepository', () => {
  it('filters by role and active flag', async () => {
    const repository = new MockUserRepository();
    const admins = await repository.list({ page: 1, pageSize: 50, role: 'admin' });
    const inactive = await repository.list({ page: 1, pageSize: 50, active: false });

    expect(admins.items.every((user) => user.role === 'admin')).toBe(true);
    expect(inactive.items.every((user) => !user.active)).toBe(true);
    expect(inactive.total).toBeGreaterThan(0);
  });

  it('creates a user and rejects a duplicate mobile', async () => {
    const repository = new MockUserRepository();
    const created = await repository.create(input);

    expect(created.active).toBe(true);
    expect((await repository.list({ page: 1, pageSize: 1 })).items[0]?.id).toBe(created.id);
    await expect(repository.create(input)).rejects.toBeInstanceOf(DuplicateMobileError);
  });

  it('counts active users per role and updates on deactivation', async () => {
    const repository = new MockUserRepository();
    const before = await repository.countByRole();
    const agent = mockUsers.find((user) => user.role === 'agent' && user.active)!;

    await repository.setActive(agent.id, false);

    expect((await repository.countByRole()).agent).toBe(before.agent - 1);
  });
});
