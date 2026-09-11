import { delay } from '@/mocks/delay';
import type { AuthRepository } from '../domain/AuthRepository';
import { InvalidCredentialsError, isValidMobile, type Credentials } from '../domain/credentials';
import type { User } from '../domain/user';
import { getDevRole, getDevSessionMobile, setDevSessionMobile } from './devSession';

const names = { agent: 'سارا احمدی', supervisor: 'علی رضایی', admin: 'مدیر سیستم' } as const;

const userFor = (mobile: string): User => {
  const role = getDevRole();
  return { id: `dev-${role}`, fullName: names[role], mobile, role };
};

/** Accepts any valid mobile with a non-empty password. */
export class MockAuthRepository implements AuthRepository {
  async getCurrentUser() {
    await delay(150);
    const mobile = getDevSessionMobile();
    return mobile ? userFor(mobile) : null;
  }

  async signIn({ mobile, password }: Credentials) {
    await delay(400);
    if (!isValidMobile(mobile) || password.length === 0) throw new InvalidCredentialsError();
    setDevSessionMobile(mobile);
    return userFor(mobile);
  }

  async signOut() {
    await delay(100);
    setDevSessionMobile(null);
  }
}
