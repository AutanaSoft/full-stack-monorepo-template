import { UserResponseSchema, type UserResponse } from '@autanasoft/contracts';
import type { PublicUser } from './domain/user';

export function toUserResponse(user: PublicUser): UserResponse {
  return UserResponseSchema.parse({
    id: user.id,
    email: user.email,
    userName: user.userName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
