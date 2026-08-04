import { UpdateUserSchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
