import { Inject, Injectable } from '@nestjs/common';
import type { CreateUser } from '@autanasoft/contracts';
import { PASSWORD_HASHER } from '../../password/password.tokens';
import type { PasswordHasher } from '../../password/password-hasher';
import {
  CreateUserPersistenceInput,
  normalizeEmail,
  normalizeUserName,
  PublicUser,
} from '../domain/user';
import { UserIdentityConflictError } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { userIdentityConflict } from './users.application-errors';
import { USER_REPOSITORY } from '../users.tokens';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUser): Promise<PublicUser> {
    const persistenceInput: CreateUserPersistenceInput = {
      email: normalizeEmail(input.email),
      userName: normalizeUserName(input.userName),
      passwordHash: await this.passwordHasher.hash(input.password),
    };

    try {
      return await this.repository.create(persistenceInput);
    } catch (error: unknown) {
      if (error instanceof UserIdentityConflictError) {
        throw userIdentityConflict(error.field);
      }

      throw error;
    }
  }
}
