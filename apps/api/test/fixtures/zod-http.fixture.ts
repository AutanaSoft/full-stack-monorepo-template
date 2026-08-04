import { Body, Controller, Get, Module, Post } from '@nestjs/common';
import {
  CreateUserSchema,
  UserResponseSchema,
  type CreateUser,
  type UserResponse,
} from '@autanasoft/contracts';
import { ZodResponse, createZodDto } from 'nestjs-zod';

export class CreateUserFixtureDto extends createZodDto(CreateUserSchema) {}

export class UserResponseFixtureDto extends createZodDto(UserResponseSchema.strip()) {}

function toFixtureUser(input: CreateUser): UserResponse {
  return {
    id: '123e4567-e89b-42d3-a456-426614174000',
    email: input.email,
    userName: input.userName,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

@Controller('zod-fixture')
export class ZodHttpFixtureController {
  @Post()
  @ZodResponse({ status: 201, type: UserResponseFixtureDto })
  create(@Body() input: CreateUserFixtureDto): UserResponse {
    const response = {
      ...toFixtureUser(input),
      password: input.password,
      passwordHash: 'must-be-removed',
    };

    return response;
  }

  @Get('raw')
  getRaw(): { internal: string; value: string } {
    return { internal: 'untouched', value: 'raw-response' };
  }
}

@Module({
  controllers: [ZodHttpFixtureController],
})
export class ZodHttpFixtureModule {}
