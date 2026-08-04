import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseClient } from '@autanasoft/database';
import { DATABASE_CONNECTION } from '../../database/database.tokens';
import type { DatabaseConnection } from '@autanasoft/database';
import {
  CreateUserPersistenceInput,
  normalizeUserNameForQuery,
  PaginatedUsers,
  PublicUser,
  UpdateUserPersistenceInput,
  UserListQuery,
} from '../domain/user';
import { UserIdentity, UserIdentityConflictError, UserRepository } from '../domain/user.repository';

const publicUserSelect = {
  id: true,
  email: true,
  userName: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function conflictField(error: unknown): 'email' | 'userName' {
  if (typeof error === 'object' && error !== null && 'meta' in error) {
    const target = (error as { meta?: { target?: unknown } }).meta?.target;

    if (Array.isArray(target) && target.some((value) => value === 'email')) {
      return 'email';
    }
  }

  return 'userName';
}

function toUser(record: PublicUser): PublicUser {
  return record;
}

function toOrderBy(query: UserListQuery): Record<string, 'asc' | 'desc'> {
  return { [query.sortBy]: query.sortDirection };
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  private readonly client: DatabaseClient;

  constructor(@Inject(DATABASE_CONNECTION) connection: DatabaseConnection) {
    this.client = connection.client;
  }

  async findById(id: string): Promise<PublicUser | null> {
    const record = await this.client.user.findFirst({
      where: { id, deletedAt: null },
      select: publicUserSelect,
    });

    return record === null ? null : toUser(record);
  }

  async findByIdentity(identity: UserIdentity): Promise<PublicUser | null> {
    const where =
      'email' in identity
        ? { email: identity.email, deletedAt: null }
        : {
            userName: {
              equals: normalizeUserNameForQuery(identity.userName),
              mode: 'insensitive' as const,
            },
            deletedAt: null,
          };
    const record = await this.client.user.findFirst({ where, select: publicUserSelect });

    return record === null ? null : toUser(record);
  }

  async list(query: UserListQuery): Promise<PaginatedUsers> {
    const where = { deletedAt: null };
    const [total, records] = await Promise.all([
      this.client.user.count({ where }),
      this.client.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: toOrderBy(query),
        select: publicUserSelect,
      }),
    ]);

    return {
      data: records.map(toUser),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async create(input: CreateUserPersistenceInput): Promise<PublicUser> {
    try {
      const record = await this.client.user.create({
        data: input,
        select: publicUserSelect,
      });

      return toUser(record);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new UserIdentityConflictError(conflictField(error));
      }

      throw error;
    }
  }

  async update(id: string, input: UpdateUserPersistenceInput): Promise<PublicUser | null> {
    try {
      const result = await this.client.user.updateMany({
        where: { id, deletedAt: null },
        data: input,
      });

      if (result.count === 0) {
        return null;
      }

      const record = await this.client.user.findFirst({
        where: { id, deletedAt: null },
        select: publicUserSelect,
      });

      return record === null ? null : toUser(record);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new UserIdentityConflictError(conflictField(error));
      }

      throw error;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.client.user.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count > 0;
  }
}
