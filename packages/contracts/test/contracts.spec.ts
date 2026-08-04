import {
  CreateUserSchema,
  ErrorResponseSchema,
  FindUserQuerySchema,
  ListUsersQuerySchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PaginationSchema,
  PasswordSchema,
  RequestIdSchema,
  UpdateUserSchema,
  UserIdParamsSchema,
  UserListResponseSchema,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  UserNameSchema,
  UserResponseSchema,
} from '../src';
import type {
  CreateUser,
  ErrorResponse,
  FindUserQuery,
  ListUsersQuery,
  Pagination,
  RequestId,
  UpdateUser,
  UserIdParams,
  UserListResponse,
  UserResponse,
} from '../src';

const validCreateUser = {
  email: 'user@example.com',
  userName: 'User_123',
  password: 'correct horse battery staple',
} satisfies CreateUser;

const validUserResponse = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  userName: 'User_123',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
} satisfies UserResponse;

describe('common contracts', () => {
  it('validates request IDs and rejects unsafe values', () => {
    const requestId: RequestId = RequestIdSchema.parse('request-123');

    expect(requestId).toBe('request-123');
    expect(RequestIdSchema.safeParse('').success).toBe(false);
    expect(RequestIdSchema.safeParse('request id').success).toBe(false);
    expect(RequestIdSchema.safeParse('request\n123').success).toBe(false);
  });

  it('validates strict error responses and complete pagination metadata', () => {
    const errorResponse: ErrorResponse = ErrorResponseSchema.parse({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'The request is invalid',
      timestamp: '2026-08-02T00:00:00.000Z',
      path: '/api/v1/users',
      requestId: 'request-123',
    });
    const pagination: Pagination = PaginationSchema.parse({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    expect(errorResponse.requestId).toBe('request-123');
    expect(pagination.totalPages).toBe(0);
    expect(() =>
      ErrorResponseSchema.parse({
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'The request is invalid',
        timestamp: '2026-08-02T00:00:00.000Z',
        path: '/api/v1/users',
        requestId: 'request-123',
        stack: 'internal stack',
      }),
    ).toThrow();
    expect(() =>
      PaginationSchema.parse({ page: 1, limit: 20, total: -1, totalPages: 0 }),
    ).toThrow();
  });
});

describe('user request contracts', () => {
  it('accepts the public create fields and rejects persistence fields', () => {
    expect(CreateUserSchema.parse(validCreateUser)).toEqual(validCreateUser);
    expect(() =>
      CreateUserSchema.parse({ ...validCreateUser, id: validUserResponse.id }),
    ).toThrow();
    expect(() =>
      CreateUserSchema.parse({ ...validCreateUser, passwordHash: 'stored-hash' }),
    ).toThrow();
    expect(() =>
      CreateUserSchema.parse({ ...validCreateUser, createdAt: validUserResponse.createdAt }),
    ).toThrow();
    expect(() => CreateUserSchema.parse({ ...validCreateUser, unknown: true })).toThrow();
  });

  it('reuses the username policy and validates update refinements', () => {
    const update: UpdateUser = UpdateUserSchema.parse({ password: validCreateUser.password });

    expect(update.password).toBe(validCreateUser.password);
    expect(PasswordSchema.safeParse('a'.repeat(PASSWORD_MIN_LENGTH - 1)).success).toBe(false);
    expect(PasswordSchema.safeParse('a'.repeat(PASSWORD_MIN_LENGTH)).success).toBe(true);
    expect(PasswordSchema.safeParse('a'.repeat(PASSWORD_MAX_LENGTH + 1)).success).toBe(false);
    expect(UserNameSchema.safeParse('a'.repeat(USERNAME_MIN_LENGTH - 1)).success).toBe(false);
    expect(UserNameSchema.safeParse('a'.repeat(USERNAME_MIN_LENGTH)).success).toBe(true);
    expect(UserNameSchema.safeParse('a'.repeat(USERNAME_MAX_LENGTH)).success).toBe(true);
    expect(UserNameSchema.safeParse('a'.repeat(USERNAME_MAX_LENGTH + 1)).success).toBe(false);
    expect(UserNameSchema.safeParse('user-name').success).toBe(false);
    expect(UserNameSchema.safeParse('User_123').success).toBe(true);
    expect(() => UpdateUserSchema.parse({})).toThrow();
    expect(() => UpdateUserSchema.parse({ email: undefined })).toThrow();
    expect(() => UpdateUserSchema.parse({ deletedAt: null })).toThrow();
  });

  it('requires exactly one find criterion and rejects unknown keys', () => {
    const byEmail: FindUserQuery = FindUserQuerySchema.parse({ email: validCreateUser.email });
    const byUserName: FindUserQuery = FindUserQuerySchema.parse({
      userName: validCreateUser.userName,
    });

    expect(byEmail.email).toBe(validCreateUser.email);
    expect(byUserName.userName).toBe(validCreateUser.userName);
    expect(() => FindUserQuerySchema.parse({})).toThrow();
    expect(() =>
      FindUserQuerySchema.parse({
        email: validCreateUser.email,
        userName: validCreateUser.userName,
      }),
    ).toThrow();
    expect(() =>
      FindUserQuerySchema.parse({ email: validCreateUser.email, id: 'unexpected' }),
    ).toThrow();
  });

  it('applies query defaults, coercion, bounds, and allowlists', () => {
    const defaults: ListUsersQuery = ListUsersQuerySchema.parse({});
    const explicit: ListUsersQuery = ListUsersQuerySchema.parse({
      page: '2',
      limit: '50',
      sortBy: 'userName',
      sortDirection: 'asc',
    });

    expect(defaults).toEqual({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
    expect(explicit).toEqual({
      page: 2,
      limit: 50,
      sortBy: 'userName',
      sortDirection: 'asc',
    });
    expect(() => ListUsersQuerySchema.parse({ page: '0' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ page: '10001' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ limit: '0' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ limit: '101' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ sortBy: 'email' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ sortDirection: 'up' })).toThrow();
    expect(() => ListUsersQuerySchema.parse({ offset: '0' })).toThrow();
  });
});

describe('user response contracts', () => {
  it('accepts only the positive public user projection', () => {
    const response: UserResponse = UserResponseSchema.parse(validUserResponse);
    const params: UserIdParams = UserIdParamsSchema.parse({ id: validUserResponse.id });
    const listResponse: UserListResponse = UserListResponseSchema.parse({
      data: [validUserResponse],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    expect(response).toEqual(validUserResponse);
    expect(params.id).toBe(validUserResponse.id);
    expect(listResponse.data).toHaveLength(1);
    expect(() =>
      UserResponseSchema.parse({ ...validUserResponse, passwordHash: 'secret' }),
    ).toThrow();
    expect(() =>
      UserResponseSchema.parse({ ...validUserResponse, normalizedUserName: 'user_123' }),
    ).toThrow();
    expect(() => UserResponseSchema.parse({ ...validUserResponse, deletedAt: null })).toThrow();
    expect(() => UserIdParamsSchema.parse({ id: validUserResponse.id, extra: true })).toThrow();
    expect(() =>
      UserListResponseSchema.parse({
        data: [validUserResponse],
        pagination: { page: 1, limit: 20, total: 1 },
      }),
    ).toThrow();
  });
});
