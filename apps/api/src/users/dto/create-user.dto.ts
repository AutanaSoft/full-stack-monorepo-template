import { CreateUserSchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
