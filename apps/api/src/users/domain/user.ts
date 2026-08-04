import type { UserListSortDirection, UserListSortField } from '@autanasoft/contracts';

export interface User {
  id: string;
  email: string;
  userName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface CreateUserPersistenceInput {
  email: string;
  userName: string;
  passwordHash: string;
}

export interface UpdateUserPersistenceInput {
  email?: string;
  userName?: string;
  passwordHash?: string;
}

export interface UserListQuery {
  page: number;
  limit: number;
  sortBy: UserListSortField;
  sortDirection: UserListSortDirection;
}

export interface PaginatedUsers {
  data: PublicUser[];
  total: number;
  page: number;
  limit: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUserName(userName: string): string {
  return userName.trim();
}

export function normalizeUserNameForQuery(userName: string): string {
  return normalizeUserName(userName).toLowerCase();
}
