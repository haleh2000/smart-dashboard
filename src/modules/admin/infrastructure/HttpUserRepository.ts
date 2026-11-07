import { ApiError, type HttpClient } from '@/shared/http';
import type { Role } from '@/modules/auth';
import type { Page } from '@/shared/domain/pagination';
import type { UserQuery, UserRepository } from '../domain/AdminRepositories';
import { DuplicateMobileError, type StaffUser, type StaffUserInput } from '../domain/staffUser';

type StaffUserDto = Omit<StaffUser, 'createdAt' | 'lastLoginAt'> & {
  createdAt: string;
  lastLoginAt?: string;
};

const parseUser = (raw: StaffUserDto): StaffUser => ({
  ...raw,
  createdAt: new Date(raw.createdAt),
  lastLoginAt: raw.lastLoginAt ? new Date(raw.lastLoginAt) : undefined,
  email: raw.email || undefined,
});

const rethrowDuplicate = (error: unknown): never => {
  if (error instanceof ApiError && error.status === 409) throw new DuplicateMobileError();
  throw error;
};

/** Talks to VOC Panel Nest `/user` endpoints (صفحه کاربران). */
export class HttpUserRepository implements UserRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(query: UserQuery): Promise<Page<StaffUser>> {
    const page = await this.#http.get<{
      items: StaffUserDto[];
      total: number;
      page: number;
      pageSize: number;
    }>('/user', {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        role: query.role,
        active: query.active,
      },
    });

    return {
      items: page.items.map(parseUser),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async create(input: StaffUserInput): Promise<StaffUser> {
    try {
      const raw = await this.#http.post<StaffUserDto>('/user', { body: input });
      return parseUser(raw);
    } catch (error) {
      return rethrowDuplicate(error);
    }
  }

  async update(id: string, input: StaffUserInput): Promise<StaffUser> {
    try {
      const raw = await this.#http.patch<StaffUserDto>(`/user/${id}`, { body: input });
      return parseUser(raw);
    } catch (error) {
      return rethrowDuplicate(error);
    }
  }

  async setActive(id: string, active: boolean): Promise<StaffUser> {
    const raw = await this.#http.patch<StaffUserDto>(`/user/${id}/active`, {
      body: { active },
    });
    return parseUser(raw);
  }

  countByRole() {
    return this.#http.get<Record<Role, number>>('/user/count-by-role');
  }
}
