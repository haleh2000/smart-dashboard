import { permissionsOf } from '@/modules/auth';
import { SystemRoleError } from '../domain/roleDefinition';
import { MockRoleRepository } from './MockRoleRepository';

describe('MockRoleRepository', () => {
  it('seeds the built-in roles from the RBAC matrix, plus custom samples', async () => {
    const roles = await new MockRoleRepository().list();
    const supervisor = roles.find((role) => role.id === 'supervisor')!;

    expect(supervisor.system).toBe(true);
    expect(supervisor.permissions).toEqual(permissionsOf('supervisor'));
    expect(roles.some((role) => !role.system)).toBe(true);
  });

  it('creates, updates and removes a custom role', async () => {
    const repository = new MockRoleRepository();
    const created = await repository.create({
      name: ' نقش تازه ',
      description: '',
      permissions: ['tickets.view'],
    });
    expect(created.name).toBe('نقش تازه');

    const updated = await repository.update(created.id, {
      name: 'نقش ویرایش‌شده',
      description: 'توضیح',
      permissions: ['calls.view'],
    });
    expect(updated.permissions).toEqual(['calls.view']);

    await repository.remove(created.id);
    expect((await repository.list()).some((role) => role.id === created.id)).toBe(false);
  });

  it('keeps system role names and the admin lock, and refuses to delete them', async () => {
    const repository = new MockRoleRepository();
    const admin = await repository.update('admin', {
      name: 'تغییر نام',
      description: '',
      permissions: ['tickets.view'],
    });

    expect(admin.name).toBe('مدیر');
    expect(admin.permissions).toContain('admin.manage');
    await expect(repository.remove('admin')).rejects.toBeInstanceOf(SystemRoleError);
  });
});
