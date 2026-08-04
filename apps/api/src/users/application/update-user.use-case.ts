import { Inject, Injectable } from '@nestjs/common';
import type { UpdateUser } from '@autanasoft/contracts';
import { PASSWORD_HASHER } from '../../password/password.tokens';
import type { PasswordHasher } from '../../password/password-hasher';
import {
  normalizeEmail,
  normalizeUserName,
  PublicUser,
  UpdateUserPersistenceInput,
} from '../domain/user';
import { UserIdentityConflictError } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { USER_REPOSITORY } from '../users.tokens';
import { userIdentityConflict, userNotFound } from './users.application-errors';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(id: string, input: UpdateUser): Promise<PublicUser> {
    const persistenceInput: UpdateUserPersistenceInput = {};

    if (input.email !== undefined) {
      persistenceInput.email = normalizeEmail(input.email);
    }

    if (input.userName !== undefined) {
      persistenceInput.userName = normalizeUserName(input.userName);
    }

    if (input.password !== undefined) {
      persistenceInput.passwordHash = await this.passwordHasher.hash(input.password);
    }

    try {
      const user = await this.repository.update(id, persistenceInput);

      if (user === null) {
        throw userNotFound();
      }

      return user;
    } catch (error: unknown) {
      if (error instanceof UserIdentityConflictError) {
        throw userIdentityConflict(error.field);
      }

      throw error;
    }
  }
}
