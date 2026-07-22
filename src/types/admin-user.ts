import type { Identity, User } from './admin';

export type AdminUserDetail = User & {
  identity?: Identity | null;
};

export const roleLabels: Record<number, string> = {
  0: 'User',
  1: 'Moderator',
  2: 'Admin',
};

export const accountStatusLabels: Record<number, string> = {
  0: 'Banned',
  1: 'Active',
  2: 'Deleted',
};

export const identityStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
};
