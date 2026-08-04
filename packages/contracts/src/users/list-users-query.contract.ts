import { z } from 'zod';

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
  PAGINATION_MAX_PAGE,
} from '../common/pagination.contract';

export const USER_LIST_SORT_FIELDS = ['createdAt', 'updatedAt', 'userName'] as const;
export const USER_LIST_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export const UserListSortFieldSchema = z.enum(USER_LIST_SORT_FIELDS);
export const UserListSortDirectionSchema = z.enum(USER_LIST_SORT_DIRECTIONS);

export const ListUsersQuerySchema = z.strictObject({
  page: z.coerce
    .number()
    .int()
    .min(PAGINATION_DEFAULT_PAGE)
    .max(PAGINATION_MAX_PAGE)
    .default(PAGINATION_DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION_DEFAULT_PAGE)
    .max(PAGINATION_MAX_LIMIT)
    .default(PAGINATION_DEFAULT_LIMIT),
  sortBy: UserListSortFieldSchema.default('createdAt'),
  sortDirection: UserListSortDirectionSchema.default('desc'),
});

export type UserListSortField = (typeof USER_LIST_SORT_FIELDS)[number];
export type UserListSortDirection = (typeof USER_LIST_SORT_DIRECTIONS)[number];
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
