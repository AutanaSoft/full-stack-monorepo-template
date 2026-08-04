import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export const EmailSchema = z.email();
export const PasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);
export const UserNameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(USERNAME_PATTERN);

export const CreateUserSchema = z.strictObject({
  email: EmailSchema,
  userName: UserNameSchema,
  password: PasswordSchema,
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
