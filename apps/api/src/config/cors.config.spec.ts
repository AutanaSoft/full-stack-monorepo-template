import { CorsConfigSchema, corsConfigFactory } from './cors.config';

describe('API CORS configuration', () => {
  it('uses explicit safe defaults', () => {
    expect(CorsConfigSchema.parse({})).toMatchObject({
      CORS_ENABLED: true,
      CORS_ORIGINS: [],
      CORS_METHODS: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      CORS_ALLOWED_HEADERS: ['content-type', 'authorization', 'x-request-id'],
      CORS_EXPOSED_HEADERS: ['x-request-id'],
      CORS_CREDENTIALS: false,
      CORS_MAX_AGE_SECONDS: 600,
    });
  });

  it('trims list values, removes empty entries, and normalizes names', () => {
    expect(
      corsConfigFactory({
        CORS_ORIGINS: ' https://example.com, ,http://localhost:3000/ ',
        CORS_METHODS: 'get, POST,',
        CORS_ALLOWED_HEADERS: ' Content-Type, X-Request-Id, ',
        CORS_EXPOSED_HEADERS: ' X-Request-Id, ',
      })
    ).toMatchObject({
      CORS_ORIGINS: ['https://example.com', 'http://localhost:3000'],
      CORS_METHODS: ['GET', 'POST'],
      CORS_ALLOWED_HEADERS: ['content-type', 'x-request-id'],
      CORS_EXPOSED_HEADERS: ['x-request-id'],
    });
  });

  it('parses false as false', () => {
    expect(corsConfigFactory({ CORS_ENABLED: 'false', CORS_CREDENTIALS: 'false' })).toMatchObject({
      CORS_ENABLED: false,
      CORS_CREDENTIALS: false,
    });
  });

  it.each([
    { CORS_ORIGINS: 'not-an-origin' },
    { CORS_METHODS: 'GET,INVALID' },
    { CORS_ALLOWED_HEADERS: 'bad header' },
    { CORS_MAX_AGE_SECONDS: '-1' },
    { CORS_ENABLED: 'yes' },
  ])('rejects malformed CORS input: %p', (input) => {
    expect(() => CorsConfigSchema.parse(input)).toThrow();
  });
});
