import { Inject, Injectable } from '@nestjs/common';
import { PublicUser } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';
import { userNotFound } from './users.application-errors';
import { USER_REPOSITORY } from '../users.tokens';

@Injectable()
export class GetUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repository: UserRepository) {}

  async execute(id: string): Promise<PublicUser> {
    const user = await this.repository.findById(id);

    if (user === null) {
      throw userNotFound();
    }

    return user;
  }
}
