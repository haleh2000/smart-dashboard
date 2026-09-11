import { permissionsOf, roleDescriptions, roleLabels, ROLES } from '@/modules/auth';
import { delay } from '@/mocks/delay';
import type { RoleRepository } from '../domain/AdminRepositories';
import {
  isLockedPermission,
  SystemRoleError,
  type RoleDefinition,
  type RoleInput,
} from '../domain/roleDefinition';

const LAUNCH = new Date('2025-03-01T08:00:00');

const systemRoles = (): RoleDefinition[] =>
  ROLES.map((role) => ({
    id: role,
    name: roleLabels[role],
    description: roleDescriptions[role],
    permissions: [...permissionsOf(role)],
    system: true,
    baseRole: role,
    createdAt: LAUNCH,
  }));

const sampleRoles: RoleDefinition[] = [
  {
    id: 'role-qa',
    name: 'کارشناس کنترل کیفیت',
    description: 'شنیدن مکالمات، بررسی تحلیل احساسات و گزارش کیفیت پاسخ‌گویی اپراتورها',
    permissions: ['dashboard.view', 'calls.view', 'tickets.view'],
    system: false,
    baseRole: 'supervisor',
    createdAt: new Date('2025-06-12T10:30:00'),
  },
  {
    id: 'role-claims',
    name: 'کارشناس خسارت',
    description: 'پیگیری تیکت‌ها و پرونده‌های خسارت و مشاهده سوابق بیمه‌ای مشتری',
    permissions: ['tickets.view', 'customers.view'],
    system: false,
    baseRole: 'agent',
    createdAt: new Date('2025-08-02T09:15:00'),
  },
];

/** In-memory adapter. The app's effective access still comes from `rolePermissions` until the API exists. */
export class MockRoleRepository implements RoleRepository {
  private roles: RoleDefinition[];
  private sequence = 0;

  constructor(roles: RoleDefinition[] = [...systemRoles(), ...sampleRoles]) {
    this.roles = roles.map((role) => ({ ...role, permissions: [...role.permissions] }));
  }

  async list(): Promise<RoleDefinition[]> {
    await delay(200);
    return this.roles.map((role) => ({ ...role, permissions: [...role.permissions] }));
  }

  async create(input: RoleInput): Promise<RoleDefinition> {
    await delay();
    this.sequence += 1;
    const role: RoleDefinition = {
      id: `role-${Date.now()}-${this.sequence}`,
      name: input.name.trim(),
      description: input.description.trim(),
      permissions: [...input.permissions],
      system: false,
      baseRole: input.baseRole,
      createdAt: new Date(),
    };
    this.roles = [...this.roles, role];
    return role;
  }

  async update(id: string, input: RoleInput): Promise<RoleDefinition> {
    await delay(200);
    const current = this.roles.find((role) => role.id === id);
    if (!current) throw new Error(`Role ${id} not found`);
    const locked = current.permissions.filter((p) => isLockedPermission(current, p));
    const next: RoleDefinition = {
      ...current,
      name: current.system ? current.name : input.name.trim(),
      description: input.description.trim(),
      permissions: [...new Set([...locked, ...input.permissions])],
      baseRole: current.system ? current.baseRole : input.baseRole,
    };
    this.roles = this.roles.map((role) => (role.id === id ? next : role));
    return next;
  }

  async remove(id: string): Promise<void> {
    await delay(200);
    const current = this.roles.find((role) => role.id === id);
    if (!current) throw new Error(`Role ${id} not found`);
    if (current.system) throw new SystemRoleError();
    this.roles = this.roles.filter((role) => role.id !== id);
  }
}
