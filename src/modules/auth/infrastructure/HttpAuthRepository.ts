import { ApiError, type HttpClient } from '@/shared/http';
import type { AuthRepository } from '../domain/AuthRepository';
import {
  InvalidCredentialsError,
  type Credentials,
} from '../domain/credentials';
import { ROLES, type Role } from '../domain/role';
import type { User } from '../domain/user';
import { tokenStore } from './tokenStore';

type LoginResponse = {
  user: User;
  access_token: string;
  refresh_token: string;
};

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

const parseUser = (value: unknown): User => {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid user payload from auth API');
  }

  const raw = value as Record<string, unknown>;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.fullName !== 'string' ||
    typeof raw.mobile !== 'string' ||
    !isRole(raw.role)
  ) {
    throw new Error('Invalid user payload from auth API');
  }

  return {
    id: raw.id,
    fullName: raw.fullName,
    mobile: raw.mobile,
    role: raw.role,
  };
};

/** Talks to VOC Panel Nest auth endpoints (`/auth/login`, `/auth/me`, `/auth/logout`). */
export class HttpAuthRepository implements AuthRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!tokenStore.getAccessToken()) return null;

    try {
      return parseUser(await this.#http.get<unknown>('/auth/me'));
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        tokenStore.clear();
        return null;
      }
      throw error;
    }
  }

  async signIn(credentials: Credentials): Promise<User> {
    try {
      const response = await this.#http.post<LoginResponse>('/auth/login', {
        body: credentials,
      });
      const user = parseUser(response.user);
      tokenStore.setTokens(response.access_token, response.refresh_token);
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (tokenStore.getAccessToken()) {
        await this.#http.post('/auth/logout');
      }
    } catch {
      // Always clear local session even if the server call fails (e.g. expired access token).
    } finally {
      tokenStore.clear();
    }
  }
}
