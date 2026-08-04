import { z } from 'zod';

import { RequestIdSchema } from './request-id.contract';

export const ErrorResponseSchema = z.strictObject({
  statusCode: z.number().int().min(400).max(599),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Z][A-Z0-9_]*$/),
  message: z.string().min(1).max(500),
  timestamp: z.iso.datetime(),
  path: z.string().min(1),
  requestId: RequestIdSchema,
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
