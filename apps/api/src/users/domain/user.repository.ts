import type {
  CreateUserPersistenceInput,
  PaginatedUsers,
  PublicUser,
  UpdateUserPersistenceInput,
  UserListQuery,
} from './user';

export type UserIdentity = { email: string } | { userName: string };

export class UserIdentityConflictError extends Error {
  constructor(readonly field: 'email' | 'userName') {
    super(`A user with this ${field} already exists.`);
    this.name = 'UserIdentityConflictError';
  }
}

export interface UserRepository {
  findById(id: string): Promise<PublicUser | null>;
  findByIdentity(identity: UserIdentity): Promise<PublicUser | null>;
  list(query: UserListQuery): Promise<PaginatedUsers>;
  create(input: CreateUserPersistenceInput): Promise<PublicUser>;
  update(id: string, input: UpdateUserPersistenceInput): Promise<PublicUser | null>;
  softDelete(id: string): Promise<boolean>;
}
