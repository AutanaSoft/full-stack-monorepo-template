import { FindUserQuerySchema } from '@autanasoft/contracts';
import { createZodDto } from 'nestjs-zod';

export class FindUserQueryDto extends createZodDto(FindUserQuerySchema) {}
