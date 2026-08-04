import type { CreateUser } from '@autanasoft/contracts';
import type { PasswordHasher } from '../../password/password-hasher';
import { CreateUserUseCase } from './create-user.use-case';
import { FindUserUseCase } from './find-user.use-case';
import { GetUserUseCase } from './get-user.use-case';
import { ListUsersUseCase } from './list-users.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import type { UserRepository } from '../domain/user.repository';
import { UserIdentityConflictError } from '../domain/user.repository';
import type { PublicUser } from '../domain/user';

const user: PublicUser = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  email: 'user@example.com',
  userName: 'User_Name',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

function createRepository(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn().mockResolvedValue(user),
    findByIdentity: jest.fn().mockResolvedValue(user),
    list: jest.fn().mockResolvedValue({ data: [user], total: 1, page: 1, limit: 20 }),
    create: jest.fn().mockResolvedValue(user),
    update: jest.fn().mockResolvedValue(user),
    softDelete: jest.fn().mockResolvedValue(true),
  };
}

function createHasher(): jest.Mocked<PasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue('new-hash'),
    verify: jest.fn(),
    needsRehash: jest.fn(),
  };
}

describe('user use cases', () => {
  it('normalizes identities and hashes the password before create', async () => {
    const repository = createRepository();
    const hasher = createHasher();
    const useCase = new CreateUserUseCase(repository, hasher);
    const input: CreateUser = {
      email: ' User@Example.COM ',
      userName: ' User_Name ',
      password: 'valid-password',
    };

    await useCase.execute(input);

    expect(hasher.hash.mock.calls).toContainEqual([input.password]);
    expect(repository.create.mock.calls).toContainEqual([
      { email: 'user@example.com', userName: 'User_Name', passwordHash: 'new-hash' },
    ]);
  });

  it('maps repository identity conflicts to stable application errors', async () => {
    const repository = createRepository();
    repository.create.mockRejectedValue(new UserIdentityConflictError('email'));
    const useCase = new CreateUserUseCase(repository, createHasher());

    await expect(
      useCase.execute({
        email: 'user@example.com',
        userName: 'User_Name',
        password: 'valid-password',
      }),
    ).rejects.toMatchObject({ code: 'USER_EMAIL_CONFLICT' });
  });

  it('rehashes only when a password is present in a partial update', async () => {
    const repository = createRepository();
    const hasher = createHasher();
    const useCase = new UpdateUserUseCase(repository, hasher);

    await useCase.execute(user.id, { userName: ' New_Name ' });
    expect(hasher.hash.mock.calls).toHaveLength(0);
    expect(repository.update.mock.calls).toContainEqual([user.id, { userName: 'New_Name' }]);

    await useCase.execute(user.id, { password: 'another-valid-password' });
    expect(hasher.hash.mock.calls).toContainEqual(['another-valid-password']);
    expect(repository.update.mock.calls.at(-1)).toEqual([user.id, { passwordHash: 'new-hash' }]);
  });

  it('normalizes exact identity searches and delegates list, get, and idempotent delete', async () => {
    const repository = createRepository();
    const find = new FindUserUseCase(repository);
    const list = new ListUsersUseCase(repository);
    const get = new GetUserUseCase(repository);
    const remove = new DeleteUserUseCase(repository);

    await find.execute({ userName: ' User_Name ' });
    expect(repository.findByIdentity.mock.calls).toContainEqual([{ userName: 'user_name' }]);
    await list.execute({ page: 1, limit: 20, sortBy: 'createdAt', sortDirection: 'desc' });
    await get.execute(user.id);
    await remove.execute('missing-id');
    expect(repository.softDelete.mock.calls).toContainEqual(['missing-id']);
  });

  it('maps missing update targets to not found', async () => {
    const repository = createRepository();
    repository.update.mockResolvedValue(null);

    await expect(
      new UpdateUserUseCase(repository, createHasher()).execute(user.id, {
        userName: 'New_Name',
      }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});
