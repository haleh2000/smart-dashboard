import { isValidMobile } from '@/shared/domain/mobile';

export { isValidMobile };

export interface Credentials {
  mobile: string;
  password: string;
}

/** Thrown by AuthRepository.signIn when the mobile/password pair is rejected. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}
