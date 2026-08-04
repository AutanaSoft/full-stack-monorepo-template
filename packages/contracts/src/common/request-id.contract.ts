import { z } from 'zod';

export const REQUEST_ID_MIN_LENGTH = 1;
export const REQUEST_ID_MAX_LENGTH = 128;
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/-]*$/;

export const RequestIdSchema = z
  .string()
  .min(REQUEST_ID_MIN_LENGTH)
  .max(REQUEST_ID_MAX_LENGTH)
  .regex(REQUEST_ID_PATTERN);

export type RequestId = z.infer<typeof RequestIdSchema>;
