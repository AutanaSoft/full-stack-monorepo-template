import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';
import { USER_REPOSITORY } from '../users.tokens';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repository: UserRepository) {}

  execute(id: string): Promise<boolean> {
    return this.repository.softDelete(id);
  }
}
