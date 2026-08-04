import { z } from 'zod';

import { PaginationSchema } from '../common/pagination.contract';
import { UserResponseSchema } from './user-response.contract';

export const UserListResponseSchema = z.strictObject({
  data: UserResponseSchema.array(),
  pagination: PaginationSchema,
});

export type UserListResponse = z.infer<typeof UserListResponseSchema>;
