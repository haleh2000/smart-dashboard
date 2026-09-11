import type { Credentials } from './credentials';
import type { User } from './user';

/** Port: implemented by an infrastructure adapter and injected in src/app/container.ts. */
export interface AuthRepository {
  /** Resolves to null when nobody is signed in. */
  getCurrentUser(): Promise<User | null>;
  /** Rejects with InvalidCredentialsError when the pair is wrong. */
  signIn(credentials: Credentials): Promise<User>;
  signOut(): Promise<void>;
}
