import { ApiError } from '@/shared/http';
import { InvalidCredentialsError } from '../domain/credentials';
import { HttpAuthRepository } from './HttpAuthRepository';
import { tokenStore } from './tokenStore';

const user = {
  id: '1',
  fullName: 'مدیر سیستم',
  mobile: '09120000001',
  role: 'admin' as const,
};

describe('HttpAuthRepository', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('stores tokens and returns the user on sign-in', async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        user,
        access_token: 'access',
        refresh_token: 'refresh',
      }),
      get: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    const repository = new HttpAuthRepository(http);
    await expect(repository.signIn({ mobile: user.mobile, password: '123456' })).resolves.toEqual(
      user,
    );
    expect(tokenStore.getAccessToken()).toBe('access');
    expect(tokenStore.getRefreshToken()).toBe('refresh');
  });

  it('maps 401 on sign-in to InvalidCredentialsError', async () => {
    const http = {
      post: vi.fn().mockRejectedValue(new ApiError(401, { message: 'Unauthorized' })),
      get: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    const repository = new HttpAuthRepository(http);
    await expect(
      repository.signIn({ mobile: user.mobile, password: 'bad' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('returns null for getCurrentUser when there is no token', async () => {
    const http = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    const repository = new HttpAuthRepository(http);
    await expect(repository.getCurrentUser()).resolves.toBeNull();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('clears tokens and returns null when /auth/me is unauthorized', async () => {
    tokenStore.setTokens('access', 'refresh');
    const http = {
      post: vi.fn(),
      get: vi.fn().mockRejectedValue(new ApiError(401, { message: 'Unauthorized' })),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    const repository = new HttpAuthRepository(http);
    await expect(repository.getCurrentUser()).resolves.toBeNull();
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});
