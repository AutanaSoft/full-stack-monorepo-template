import { UserResponseSchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
