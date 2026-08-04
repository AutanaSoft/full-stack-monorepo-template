import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { UserListResponse, UserResponse } from '@autanasoft/contracts';
import { ZodResponse } from 'nestjs-zod';
import { ExpandedRateLimit, StrictRateLimit } from '../common/security/rate-limit.decorators';
import { CreateUserUseCase } from './application/create-user.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { FindUserUseCase } from './application/find-user.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { toUserResponse } from './user-response.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserQueryDto } from './dto/find-user-query.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdParamsDto } from './dto/user-id-params.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PinoLogger } from 'nestjs-pino';

type RequestWithId = Request & { id?: unknown };

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly findUser: FindUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @StrictRateLimit()
  @ZodResponse({ status: 201, type: UserResponseDto })
  @ApiOperation({ summary: 'Create a user.' })
  @ApiResponse({ status: 201, description: 'The user was created.' })
  @ApiResponse({ status: 400, description: 'The request is invalid.' })
  @ApiResponse({ status: 409, description: 'The email or user name is already in use.' })
  async create(@Body() input: CreateUserDto, @Req() request: RequestWithId): Promise<UserResponse> {
    const user = await this.createUser.execute(input);
    this.log(request, 'create', 'success', user.id);
    return toUserResponse(user);
  }

  @Get()
  @ExpandedRateLimit()
  @ZodResponse({ status: 200, type: UserListResponseDto })
  @ApiOperation({ summary: 'List active users.' })
  @ApiResponse({ status: 200, description: 'The paginated user list.' })
  async list(
    @Query() query: ListUsersQueryDto,
    @Req() request: RequestWithId,
  ): Promise<UserListResponse> {
    const result = await this.listUsers.execute(query);
    this.log(request, 'list', 'success');
    return {
      data: result.data.map(toUserResponse),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('search')
  @StrictRateLimit()
  @ZodResponse({ status: 200, type: UserResponseDto })
  @ApiOperation({ summary: 'Find one active user by exact email or user name.' })
  @ApiResponse({ status: 200, description: 'The matching user.' })
  @ApiResponse({ status: 400, description: 'Exactly one search criterion is required.' })
  @ApiResponse({ status: 404, description: 'The user was not found.' })
  async search(
    @Query() query: FindUserQueryDto,
    @Req() request: RequestWithId,
  ): Promise<UserResponse> {
    const user = await this.findUser.execute(query);
    this.log(request, 'search', 'success', user.id);
    return toUserResponse(user);
  }

  @Get(':id')
  @ZodResponse({ status: 200, type: UserResponseDto })
  @ApiOperation({ summary: 'Get one active user by UUID.' })
  @ApiResponse({ status: 200, description: 'The requested user.' })
  @ApiResponse({ status: 400, description: 'The user ID is invalid.' })
  @ApiResponse({ status: 404, description: 'The user was not found.' })
  async get(
    @Param() params: UserIdParamsDto,
    @Req() request: RequestWithId,
  ): Promise<UserResponse> {
    const user = await this.getUser.execute(params.id);
    this.log(request, 'get', 'success', user.id);
    return toUserResponse(user);
  }

  @Patch(':id')
  @StrictRateLimit()
  @ZodResponse({ status: 200, type: UserResponseDto })
  @ApiOperation({ summary: 'Partially update an active user.' })
  @ApiResponse({ status: 200, description: 'The user was updated.' })
  @ApiResponse({ status: 400, description: 'The request is invalid.' })
  @ApiResponse({ status: 404, description: 'The user was not found.' })
  @ApiResponse({ status: 409, description: 'The email or user name is already in use.' })
  async update(
    @Param() params: UserIdParamsDto,
    @Body() input: UpdateUserDto,
    @Req() request: RequestWithId,
  ): Promise<UserResponse> {
    const user = await this.updateUser.execute(params.id, input);
    this.log(request, 'update', 'success', user.id);
    return toUserResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an active user.' })
  @ApiResponse({ status: 204, description: 'The user was deleted or was already absent.' })
  @ApiResponse({ status: 400, description: 'The user ID is invalid.' })
  async delete(@Param() params: UserIdParamsDto, @Req() request: RequestWithId): Promise<void> {
    const deleted = await this.deleteUser.execute(params.id);
    this.log(request, 'delete', deleted ? 'deleted' : 'absent', params.id);
  }

  private log(request: RequestWithId, operation: string, result: string, userId?: string): void {
    this.logger.info(
      {
        operation,
        result,
        requestId: typeof request.id === 'string' ? request.id : undefined,
        ...(userId === undefined ? {} : { userId }),
      },
      'User operation completed',
    );
  }
}
