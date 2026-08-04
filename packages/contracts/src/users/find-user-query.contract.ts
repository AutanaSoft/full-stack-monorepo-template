import type * as z from 'zod';

import { CreateUserSchema } from './create-user.contract';

const FindUserQueryFieldsSchema = CreateUserSchema.pick({
  email: true,
  userName: true,
}).partial();

export const FindUserQuerySchema = FindUserQueryFieldsSchema.refine(
  (value) => (value.email === undefined) !== (value.userName === undefined),
  { message: 'Exactly one of email or userName must be provided.' },
);

export type FindUserQuery = z.infer<typeof FindUserQuerySchema>;
