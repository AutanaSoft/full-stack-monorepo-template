import { HelmetConfigSchema, helmetConfigFactory } from './helmet.config';

describe('API Helmet configuration', () => {
  it('enables Helmet by default', () => {
    expect(HelmetConfigSchema.parse({})).toEqual({ HELMET_ENABLED: true });
  });

  it('parses an explicit false value', () => {
    expect(helmetConfigFactory({ HELMET_ENABLED: 'false' })).toEqual({ HELMET_ENABLED: false });
  });

  it('rejects truthy strings that are not explicit booleans', () => {
    expect(() => HelmetConfigSchema.parse({ HELMET_ENABLED: 'yes' })).toThrow();
  });
});
