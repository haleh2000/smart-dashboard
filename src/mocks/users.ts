import type { StaffUser } from '@/modules/admin';
import { createRandom } from './random';
import { agents, DAY, NOW, queues } from './reference';

/** Fake SMART staff accounts. Delete once api.yml adapters exist. */
const random = createRandom(5);

const staff: Omit<StaffUser, 'id' | 'mobile' | 'createdAt' | 'lastLoginAt'>[] = [
  ...agents.map((fullName) => ({
    fullName,
    role: 'agent' as const,
    team: random.pick(queues),
    active: true,
  })),
  { fullName: 'علی رضایی', role: 'supervisor', team: 'مرکز تماس', active: true },
  { fullName: 'پریسا کامرانی', role: 'supervisor', team: 'خسارت خودرو', active: true },
  { fullName: 'مدیر سیستم', role: 'admin', team: 'فناوری اطلاعات', active: true },
  { fullName: 'بهرام یزدانی', role: 'agent', team: 'عمومی', active: false },
];

export const mockUsers: StaffUser[] = staff.map((user, index) => ({
  ...user,
  id: `u-${index + 1}`,
  mobile: `0912${random.digits(7)}`,
  email: index % 3 === 0 ? `staff${index + 1}@dayins.example` : undefined,
  createdAt: new Date(NOW - (60 + Math.floor(random.next() * 700)) * DAY),
  lastLoginAt: user.active ? new Date(NOW - Math.floor(random.next() * 3 * DAY)) : undefined,
}));
