import { UserIdParamsSchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class UserIdParamsDto extends createZodDto(UserIdParamsSchema) {}
