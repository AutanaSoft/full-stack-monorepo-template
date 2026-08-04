import { UserListResponseSchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class UserListResponseDto extends createZodDto(UserListResponseSchema) {}
