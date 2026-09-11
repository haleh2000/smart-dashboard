export const ROLES = ['agent', 'supervisor', 'admin'] as const;
export type Role = (typeof ROLES)[number];
