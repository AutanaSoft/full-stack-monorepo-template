import { Controller, Get, Module } from '@nestjs/common';
import {
  ExpandedRateLimit,
  SkipRateLimit,
  StrictRateLimit,
} from '../../src/common/security/rate-limit.decorators';

@Controller('rate-limit-fixture')
export class RateLimitFixtureController {
  @Get('global')
  global(): string {
    return 'global';
  }

  @Get('strict')
  @StrictRateLimit()
  strict(): string {
    return 'strict';
  }

  @Get('expanded')
  @ExpandedRateLimit()
  expanded(): string {
    return 'expanded';
  }

  @Get('bypass')
  @SkipRateLimit()
  bypass(): string {
    return 'bypass';
  }
}

@Module({
  controllers: [RateLimitFixtureController],
})
export class RateLimitFixtureModule {}
