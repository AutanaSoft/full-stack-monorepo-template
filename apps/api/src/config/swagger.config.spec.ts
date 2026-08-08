import { SwaggerConfigSchema, swaggerConfigFactory } from './swagger.config';

describe('API Swagger configuration', () => {
  it('enables Swagger outside production and uses the safe path', () => {
    expect(swaggerConfigFactory({ NODE_ENV: 'development' })).toEqual({
      SWAGGER_ENABLED: true,
      SWAGGER_PATH: 'docs',
    });
  });

  it('disables Swagger by default in production and permits explicit activation', () => {
    expect(swaggerConfigFactory({ NODE_ENV: 'production' }).SWAGGER_ENABLED).toBe(false);
    expect(
      swaggerConfigFactory({
        NODE_ENV: 'production',
        SWAGGER_ENABLED: 'true',
        SWAGGER_PATH: 'openapi',
      })
    ).toEqual({ SWAGGER_ENABLED: true, SWAGGER_PATH: 'openapi' });
  });

  it.each([{ SWAGGER_PATH: '/docs' }, { SWAGGER_PATH: 'api/v1' }, { SWAGGER_ENABLED: 'yes' }])(
    'rejects unsafe Swagger input: %p',
    (input) => {
      expect(() => SwaggerConfigSchema.parse(input)).toThrow();
    }
  );
});
