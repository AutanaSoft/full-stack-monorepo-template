import type { DatabaseConnection } from '@autanasoft/database';
import { PrismaUserRepository } from './prisma-user.repository';

const record = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  email: 'user@example.com',
  userName: 'User_Name',
  passwordHash: 'hash',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

type UserRepoArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
  select?: Record<string, boolean>;
};

function createClient() {
  return {
    user: {
      findFirst: jest.fn<Promise<typeof record | null>, [UserRepoArgs]>(() =>
        Promise.resolve(record),
      ),
      findMany: jest.fn<Promise<(typeof record)[]>, [UserRepoArgs]>(() =>
        Promise.resolve([record]),
      ),
      count: jest.fn<Promise<number>, [UserRepoArgs]>(() => Promise.resolve(1)),
      create: jest.fn<Promise<typeof record>, [UserRepoArgs]>(() => Promise.resolve(record)),
      updateMany: jest.fn<Promise<{ count: number }>, [UserRepoArgs]>(() =>
        Promise.resolve({ count: 1 }),
      ),
    },
  };
}

function createRepository(client: ReturnType<typeof createClient>): PrismaUserRepository {
  const connection: DatabaseConnection = {
    client: client as unknown as DatabaseConnection['client'],
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return new PrismaUserRepository(connection);
}

describe('PrismaUserRepository', () => {
  it('selects only internal fields required to map a public user', async () => {
    const client = createClient();
    await createRepository(client).findById(record.id);

    expect(client.user.findFirst).toHaveBeenCalledWith({
      where: { id: record.id, deletedAt: null },
      select: {
        id: true,
        email: true,
        userName: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  });

  it('uses exact case-insensitive username equality and filters deleted users', async () => {
    const client = createClient();
    await createRepository(client).findByIdentity({ userName: 'user_name' });
    const [call] = client.user.findFirst.mock.calls[0] ?? [];
    if (call === undefined) {
      throw new Error('Expected findFirst to be called.');
    }

    expect(call.where).toEqual({
      userName: { equals: 'user_name', mode: 'insensitive' },
      deletedAt: null,
    });
    expect(JSON.stringify(call.where)).not.toMatch(/contains|startsWith|endsWith|regex/i);
  });

  it('filters deleted users and returns pagination metadata', async () => {
    const client = createClient();
    const result = await createRepository(client).list({
      page: 2,
      limit: 10,
      sortBy: 'userName',
      sortDirection: 'asc',
    });

    expect(client.user.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
    expect(client.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        skip: 10,
        take: 10,
        orderBy: { userName: 'asc' },
      }),
    );
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10, data: [record] });
  });

  it('maps unique races without leaking ORM errors', async () => {
    const client = createClient();
    client.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

    await expect(
      createRepository(client).create({
        email: record.email,
        userName: record.userName,
        passwordHash: record.passwordHash,
      }),
    ).rejects.toMatchObject({ name: 'UserIdentityConflictError', field: 'email' });
  });

  it('soft-deletes only active rows and returns whether a row changed', async () => {
    const client = createClient();
    const result = await createRepository(client).softDelete(record.id);

    expect(result).toBe(true);
    const [args] = client.user.updateMany.mock.calls.at(-1) ?? [];
    expect(args?.where).toEqual({ id: record.id, deletedAt: null });
    expect(args?.data?.deletedAt).toBeInstanceOf(Date);
  });
});
