import { validate } from './env.schema';

describe('Standalone application environment schema', () => {
  it('accepts an empty environment', () => {
    expect(validate({})).toEqual({});
  });

  it('preserves unknown environment keys', () => {
    expect(validate({ CUSTOM_ENV: 'preserved' })).toEqual({ CUSTOM_ENV: 'preserved' });
  });
});
