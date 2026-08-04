import { z } from 'zod';

import { EmailSchema, UserNameSchema } from './create-user.contract';

export const UserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: EmailSchema,
  userName: UserNameSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
