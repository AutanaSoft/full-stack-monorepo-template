import { Inject, Injectable } from '@nestjs/common';
import type { ListUsersQuery } from '@autanasoft/contracts';
import type { PaginatedUsers } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';
import { USER_REPOSITORY } from '../users.tokens';

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repository: UserRepository) {}

  execute(query: ListUsersQuery): Promise<PaginatedUsers> {
    return this.repository.list(query);
  }
}
