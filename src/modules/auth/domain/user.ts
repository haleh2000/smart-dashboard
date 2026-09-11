import type { Role } from './role';

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  role: Role;
}
