import { z } from 'zod';

export const UserIdParamsSchema = z.strictObject({
  id: z.uuid(),
});

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;
