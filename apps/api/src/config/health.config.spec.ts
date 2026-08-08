import { HealthConfigSchema, healthConfigFactory } from './health.config';

describe('API health configuration', () => {
  it('uses a safe disk path and threshold default', () => {
    expect(HealthConfigSchema.parse({})).toEqual({
      HEALTH_ENABLED: true,
      HEALTH_DISK_PATH: '.',
      HEALTH_DISK_THRESHOLD_PERCENT: 90,
    });
  });

  it('accepts explicit values and false booleans', () => {
    expect(
      healthConfigFactory({
        HEALTH_ENABLED: 'false',
        HEALTH_DISK_PATH: '/var/lib/api',
        HEALTH_DISK_THRESHOLD_PERCENT: '75',
      })
    ).toEqual({
      HEALTH_ENABLED: false,
      HEALTH_DISK_PATH: '/var/lib/api',
      HEALTH_DISK_THRESHOLD_PERCENT: 75,
    });
  });

  it.each([
    { HEALTH_DISK_PATH: '../outside' },
    { HEALTH_DISK_THRESHOLD_PERCENT: '-1' },
    { HEALTH_DISK_THRESHOLD_PERCENT: '101' },
  ])('rejects unsafe health input: %p', (input) => {
    expect(() => HealthConfigSchema.parse(input)).toThrow();
  });
});
