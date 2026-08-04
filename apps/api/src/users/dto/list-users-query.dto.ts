import { ListUsersQuerySchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class ListUsersQueryDto extends createZodDto(ListUsersQuerySchema) {}
