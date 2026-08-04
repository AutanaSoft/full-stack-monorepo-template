import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PasswordModule } from '../password/password.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { FindUserUseCase } from './application/find-user.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './users.controller';
import { USER_REPOSITORY } from './users.tokens';

@Module({
  imports: [DatabaseModule, PasswordModule],
  controllers: [UsersController],
  providers: [
    PrismaUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    CreateUserUseCase,
    ListUsersUseCase,
    FindUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class UsersModule {}
