import { Inject, Injectable } from '@nestjs/common';
import type { FindUserQuery } from '@autanasoft/contracts';
import { normalizeEmail, normalizeUserNameForQuery, PublicUser } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';
import { userNotFound } from './users.application-errors';
import { USER_REPOSITORY } from '../users.tokens';

@Injectable()
export class FindUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repository: UserRepository) {}

  async execute(query: FindUserQuery): Promise<PublicUser> {
    const identity =
      query.email !== undefined
        ? { email: normalizeEmail(query.email) }
        : { userName: normalizeUserNameForQuery(query.userName) };
    const user = await this.repository.findByIdentity(identity);

    if (user === null) {
      throw userNotFound();
    }

    return user;
  }
}
