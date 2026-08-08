import { AppConfigSchema, appConfigFactory } from './app.config';

describe('API app configuration', () => {
  it('uses the safe app defaults', () => {
    expect(AppConfigSchema.parse({})).toEqual({
      NODE_ENV: 'development',
      PORT: 4001,
      API_PREFIX: 'api',
      API_VERSION: 1,
      TRUST_PROXY: false,
    });
  });

  it.each([undefined, '', ' ', '\t'])('defaults blank PORT input to 4001', (PORT) => {
    expect(AppConfigSchema.parse(PORT === undefined ? {} : { PORT }).PORT).toBe(4001);
  });

  it.each([
    ['0', 0],
    ['8080', 8080],
    ['65535', 65535],
  ])('coerces valid PORT values', (PORT, expected) => {
    expect(AppConfigSchema.parse({ PORT }).PORT).toBe(expected);
  });

  it('parses routes, version, environment, and proxy hops', () => {
    expect(
      AppConfigSchema.parse({
        NODE_ENV: 'test',
        API_PREFIX: 'v1',
        API_VERSION: '2',
        TRUST_PROXY: '2',
      })
    ).toMatchObject({
      NODE_ENV: 'test',
      API_PREFIX: 'v1',
      API_VERSION: 2,
      TRUST_PROXY: 2,
    });
  });

  it.each([
    ['PORT', '-1'],
    ['PORT', '65536'],
    ['PORT', 'not-a-number'],
    ['PORT', '1.5'],
    ['NODE_ENV', 'staging'],
    ['API_PREFIX', '/api'],
    ['API_VERSION', '0'],
    ['TRUST_PROXY', '-1'],
    ['TRUST_PROXY', 'yes'],
  ])('rejects invalid %s value "%s"', (key, value) => {
    expect(() => AppConfigSchema.parse({ [key]: value })).toThrow();
  });

  it('rejects undeclared settings in the app namespace', () => {
    expect(() => AppConfigSchema.parse({ CUSTOM_ENV: 'preserved' })).toThrow();
  });

  it('parses a supplied environment input without mutating process.env', () => {
    expect(
      appConfigFactory({
        PORT: '4003',
        CUSTOM_ENV: 'ignored by the namespace',
      })
    ).toMatchObject({ PORT: 4003 });
  });
});
