import { z } from 'zod';

import { CreateUserSchema } from './create-user.contract';

const UpdateUserFieldsSchema = CreateUserSchema.pick({
  email: true,
  userName: true,
  password: true,
}).partial();

export const UpdateUserSchema = UpdateUserFieldsSchema.refine(
  (value) => Object.values(value).some((property) => property !== undefined),
  { message: 'At least one user property must be provided.' },
);

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
