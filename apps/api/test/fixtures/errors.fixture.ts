import { Controller, Get, Module } from '@nestjs/common';
import { ApplicationError } from '../../src/common/errors/application-error';

@Controller('errors-fixture')
export class ErrorsFixtureController {
  @Get('known')
  known(): void {
    throw new ApplicationError('RESOURCE_NOT_FOUND', 'internal resource detail');
  }

  @Get('unknown')
  unknown(): void {
    throw new Error('SQL connection password=secret /internal/path');
  }
}

@Module({
  controllers: [ErrorsFixtureController],
})
export class ErrorsFixtureModule {}
