import { RateLimitConfigSchema, rateLimitConfigFactory } from './rate-limit.config';

describe('API rate-limit configuration', () => {
  it('uses explicit positive defaults and the supported IP tracker', () => {
    expect(RateLimitConfigSchema.parse({})).toEqual({
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_TTL_MS: 60_000,
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_TRACKER: 'ip',
    });
  });

  it('parses disabled limits without changing the other values', () => {
    expect(rateLimitConfigFactory({ RATE_LIMIT_ENABLED: 'false' })).toMatchObject({
      RATE_LIMIT_ENABLED: false,
      RATE_LIMIT_TTL_MS: 60_000,
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_TRACKER: 'ip',
    });
  });

  it.each([
    { RATE_LIMIT_TTL_MS: '0' },
    { RATE_LIMIT_TTL_MS: '-1' },
    { RATE_LIMIT_MAX: '0' },
    { RATE_LIMIT_TRACKER: 'forwarded' },
  ])('rejects invalid rate-limit input: %p', (input) => {
    expect(() => RateLimitConfigSchema.parse(input)).toThrow();
  });
});
