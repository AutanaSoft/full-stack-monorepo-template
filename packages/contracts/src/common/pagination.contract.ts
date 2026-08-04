import { z } from 'zod';

export const PAGINATION_MIN_PAGE = 1;
export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_MAX_PAGE = 10_000;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const PaginationSchema = z.strictObject({
  page: z.number().int().min(PAGINATION_MIN_PAGE),
  limit: z.number().int().min(PAGINATION_MIN_PAGE),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
