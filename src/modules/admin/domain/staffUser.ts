import type { Role } from '@/modules/auth';
import { isValidMobile } from '@/shared/domain/mobile';

/** A SMART user (operator, supervisor, admin) managed under «مدیریت کاربران». */
export interface StaffUser {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  role: Role;
  /** Call-center team / queue the user works in. */
  team: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface StaffUserInput {
  fullName: string;
  mobile: string;
  email?: string;
  role: Role;
  team: string;
}

export type StaffUserField = keyof StaffUserInput;
export type StaffUserErrorCode = 'required' | 'invalidMobile' | 'invalidEmail';
export type StaffUserErrors = Partial<Record<StaffUserField, StaffUserErrorCode>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the user form. Expects Latin digits (normalize typed input first). */
export const validateStaffUser = (input: StaffUserInput): StaffUserErrors => {
  const errors: StaffUserErrors = {};
  if (!input.fullName.trim()) errors.fullName = 'required';
  if (!input.mobile) errors.mobile = 'required';
  else if (!isValidMobile(input.mobile)) errors.mobile = 'invalidMobile';
  if (input.email && !EMAIL_PATTERN.test(input.email)) errors.email = 'invalidEmail';
  if (!input.team.trim()) errors.team = 'required';
  return errors;
};

export const hasErrors = (errors: StaffUserErrors) => Object.keys(errors).length > 0;

/** Thrown by UserRepository when another user already has this mobile. */
export class DuplicateMobileError extends Error {
  constructor() {
    super('Duplicate mobile');
    this.name = 'DuplicateMobileError';
  }
}
